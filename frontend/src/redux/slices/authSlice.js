// src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api/auth';
import toast from 'react-hot-toast';

export const register = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      toast.error(errorMsg);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyEmail(data);
      toast.success('Email verified successfully!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Verification failed';
      toast.error(errorMsg);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('is_admin', response.data.is_admin || false);
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      toast.error(errorMsg);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authAPI.googleLogin(token);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('is_admin', response.data.is_admin || false);
      toast.success('Google login successful!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Google login failed';
      toast.error(errorMsg);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.adminLogin(data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('is_admin', 'true');
      toast.success('Admin login successful!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Admin login failed';
      toast.error(errorMsg);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('admin_role');
    toast.success('Logged out successfully');
    return null;
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(data);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Profile updated successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to update profile');
      return rejectWithValue(error.response?.data);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.changePassword(data);
      toast.success('Password changed successfully');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMsg);
      return rejectWithValue(error.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    isAdmin: localStorage.getItem('is_admin') === 'true' || false,
    adminRole: localStorage.getItem('admin_role') || null,
    loading: false,
    error: null,
  },
  reducers: {
    // Synchronous action used by the API interceptor to wipe auth state when
    // a token refresh fails — avoids the async logout thunk / circular import.
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.adminRole = null;
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ============ REGISTER ============
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = false; // Requires email verification
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Registration failed';
      });

    // ============ VERIFY EMAIL ============
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Verification failed';
      });

    // ============ LOGIN ============
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.is_admin || false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Login failed';
        state.isAuthenticated = false;
      });

    // ============ GOOGLE LOGIN ============
    builder
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.is_admin || false;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Google login failed';
        state.isAuthenticated = false;
      });

    // ============ ADMIN LOGIN ============
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAdmin = true;
        state.adminRole = action.payload.role;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Admin login failed';
        state.isAuthenticated = false;
      });

    // ============ LOGOUT ============
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.adminRole = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    // ============ UPDATE PROFILE ============
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update profile';
      });

    // ============ CHANGE PASSWORD ============
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to change password';
      });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;