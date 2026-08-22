import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute — requires login + optional role check.
 *
 * Usage:
 *   <ProtectedRoute>                          — any logged-in user
 *   <ProtectedRoute allowedRoles={[91]}>      — candidate only
 *   <ProtectedRoute allowedRoles={[61]}>      — college only
 *   <ProtectedRoute allowedRoles={[11,12]}>   — admin only
 *
 * If not logged in → /login
 * If wrong role    → /unauthorized
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user?.userTypeID)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
