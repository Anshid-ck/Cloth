// Users.jsx
import React, { useState, useEffect } from 'react';
import { Search, Eye, Shield, Trash2, MoreVertical, Mail, Phone, Calendar, X } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/auth/users/', {
        params: {
          page: currentPage,
          role: filterRole,
        },
      });
      // Adjust based on your API response structure
      setUsers(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/api/admin-panel/dashboard-stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await API.delete(`/api/auth/users/${userId}/`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await API.patch(`/api/auth/users/${userId}/`, { role: newRole });
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
      console.error(error);
    }
  };

  const filteredUsers = users.filter((user) => {
    // Hide admins and staff
    if (user.role === 'admin' || user.role === 'staff') return false;

    // Apply search filter
    return (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'staff':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
        <div className="text-sm text-gray-600">
          Total Users: <span className="font-bold text-gray-800">{stats?.total_users || 0}</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-700 text-sm font-semibold">Total Users</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total_users}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-green-700 text-sm font-semibold">Active Users</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{Math.round(stats.total_users * 0.8)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <p className="text-purple-700 text-sm font-semibold">New This Month</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{Math.round(stats.total_users * 0.15)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profile_image || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}`}
                          alt={user.first_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-600">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${user.email}`}
                        className="text-indigo-600 hover:underline flex items-center gap-2"
                      >
                        <Mail size={16} /> {user.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.phone_number ? (
                        <a href={`tel:${user.phone_number}`} className="flex items-center gap-2 hover:text-indigo-600">
                          <Phone size={16} /> {user.phone_number}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_verified ? (
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">User Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-indigo-500 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 pb-6 border-b">
                <img
                  src={selectedUser.profile_image || `https://ui-avatars.com/api/?name=${selectedUser.first_name}+${selectedUser.last_name}&size=80`}
                  alt={selectedUser.first_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                  <p className="text-gray-800">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Phone Number</p>
                  <p className="text-gray-800">{selectedUser.phone_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Role</p>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedUser.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedUser.is_verified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Joined</p>
                  <p className="text-gray-800">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Account Type</p>
                  <p className="text-gray-800">
                    {selectedUser.is_google_account ? 'Google OAuth' : 'Email/Password'}
                  </p>
                </div>
              </div>

              {/* Change Role */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Shield size={18} /> Change User Role
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {['customer', 'staff', 'admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleChangeRole(selectedUser.id, role)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        selectedUser.role === role
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-600'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">Account Summary</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-semibold">User ID:</span> {selectedUser.id}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Joined:</span> {new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Last Updated:</span> {new Date(selectedUser.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteUser(selectedUser.id);
                    setShowModal(false);
                  }}
                  className="flex-1 bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}