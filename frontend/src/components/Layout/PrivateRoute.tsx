import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function PrivateRoute() {
  const { user, loading } = useAuth()

  // Pendant la vérification initiale du token au démarrage
  if (loading) return <LoadingSpinner />

  // Race condition après login : setUser est async, navigate() peut s'exécuter
  // avant que le state soit mis à jour. Si un token existe en localStorage,
  // on attend au lieu de rediriger (le useEffect d'AuthContext va charger l'user).
  if (!user && localStorage.getItem('token')) return <LoadingSpinner />

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
