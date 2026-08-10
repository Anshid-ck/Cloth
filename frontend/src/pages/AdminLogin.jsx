// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { adminLogin } from "../redux/slices/authSlice";

export default function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const result = await dispatch(adminLogin(formData)).unwrap();
      toast.success("Admin login successful!");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Admin Login
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Enter your admin credentials to continue
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* EMAIL FIELD */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Email</label>
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
              <Mail className="text-gray-500 mr-2" size={18} />
              <input
                type="email"
                name="email"
                required
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          {/* PASSWORD FIELD */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Password</label>
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
              <Lock className="text-gray-500 mr-2" size={18} />
              <input
                type="password"
                name="password"
                required
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Logging in...
              </>
            ) : (
              "Login as Admin"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
