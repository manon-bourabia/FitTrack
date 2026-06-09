// Garde de route — redirige vers /login si l'utilisateur n'est pas connecté
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function PrivateRoute() {
  const { user, loading } = useAuth()

  // Vérification initiale du token en cours
  if (loading) return <LoadingSpinner />

  // Token présent mais user pas encore chargé (race condition après login)
  if (!user && localStorage.getItem('token')) return <LoadingSpinner />

  // Pas connecté → redirection vers /login
  if (!user) return <Navigate to="/login" replace />

  // Connecté → affiche la page demandée (via Outlet = composant enfant de la route)
  return <Outlet />
}
