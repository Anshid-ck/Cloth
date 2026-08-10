// src/components/ProtectedAdminRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
export default function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin, user, loading } = useSelector((state) => state.auth);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  // Check both isAdmin flag and user role
  if (!isAdmin && user?.role !== 'admin' && user?.role !== 'staff') {
    return <Navigate to="/" replace />;
  }
  return children;
}