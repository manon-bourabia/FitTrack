// Hook personnalisé — raccourci pour accéder au contexte d'authentification
// Utilisation : const { user, login, logout } = useAuth()
import { useContext } from 'react'
import { AuthContext, AuthContextType } from '../context/AuthContext'

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  // Erreur claire si useAuth() est appelé en dehors d'un <AuthProvider>
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
