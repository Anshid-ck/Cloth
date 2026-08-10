// Cloth-Shop/frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { User, Mail, Phone, Save, LogOut, UserCircle } from "lucide-react";
import { logout } from "../redux/slices/authSlice";
import API from "../api/api";
import toast from "react-hot-toast";

// Gender Icons as SVG  
const MaleIcon = ({ selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-4 rounded-xl border-2 transition-all ${selected
      ? 'border-blue-500 bg-blue-50 shadow-md'
      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
      }`}
  >
    <svg className={`w-8 h-8 md:w-12 md:h-12 ${selected ? 'text-blue-600' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7" r="4" />
      <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
    </svg>
    <p className={`text-sm font-medium mt-1 md:mt-2 ${selected ? 'text-blue-600' : 'text-gray-500'}`}>Male</p>
  </button>
);

const FemaleIcon = ({ selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-4 rounded-xl border-2 transition-all ${selected
      ? 'border-pink-500 bg-pink-50 shadow-md'
      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
      }`}
  >
    <svg className={`w-8 h-8 md:w-12 md:h-12 ${selected ? 'text-pink-600' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7" r="4" />
      <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
      <path d="M10 4.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5h-3a.5.5 0 01-.5-.5v-1z" opacity="0.5" />
    </svg>
    <p className={`text-sm font-medium mt-1 md:mt-2 ${selected ? 'text-pink-600' : 'text-gray-500'}`}>Female</p>
  </button>
);

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    gender: "",
  });

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get("/auth/profile/");
      setFormData({
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        phone_number: response.data.phone_number || "",
        email: response.data.email || "",
        gender: response.data.gender || "",
      });

      const addressRes = await API.get("/auth/addresses/");
      setAddresses(addressRes.data);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await API.put("/auth/profile/", formData);
      toast.success("Profile updated successfully");
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/");
    toast.success("Logged out");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-36 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${formData.gender === 'male'
              ? 'bg-blue-100'
              : formData.gender === 'female'
                ? 'bg-pink-100'
                : 'bg-indigo-100'
              }`}>
              {formData.gender === 'male' ? (
                <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
                </svg>
              ) : formData.gender === 'female' ? (
                <svg className="w-10 h-10 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
                </svg>
              ) : (
                <User size={40} className="text-indigo-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formData.first_name} {formData.last_name}
              </h1>
              <p className="text-gray-600">{formData.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Personal Information
            </h2>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Gender Selection */}
          {editing && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Gender</label>
              <div className="flex gap-4">
                <MaleIcon
                  selected={formData.gender === 'male'}
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                />
                <FemaleIcon
                  selected={formData.gender === 'female'}
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                />
              </div>
            </div>
          )}

          {/* FORM FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                disabled={!editing}
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-lg border ${editing
                  ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'border-gray-200 bg-gray-50'
                  } transition`}
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                disabled={!editing}
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-lg border ${editing
                  ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'border-gray-200 bg-gray-50'
                  } transition`}
                placeholder="Enter last name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  disabled={!editing}
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${editing
                    ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    : 'border-gray-200 bg-gray-50'
                    } transition`}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {editing && (
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-6 flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Changes
                </>
              )}
            </button>
          )}
        </div>

        {/* Logout Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
