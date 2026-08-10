// src/components/Protectedroute.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  // Show loading or nothing while checking auth
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
