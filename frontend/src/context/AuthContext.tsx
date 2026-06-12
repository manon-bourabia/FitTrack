// Contexte d'authentification — partage l'utilisateur connecté dans toute l'app
// Tous les composants peuvent accéder à user/login/logout via le hook useAuth()
import { createContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import { User } from '../types'

interface RegisterData {
  username: string
  email: string
  password: string
  weight?: number
  goal?: string
}

export interface AuthContextType {
  user: User | null       // null = non connecté
  loading: boolean        // true pendant la vérification initiale du token
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser?: (data: Partial<User>) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Au démarrage : si un token est en localStorage, vérifie sa validité et charge le profil
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Connexion : stocke le token et charge le profil utilisateur
  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  // Inscription : même logique que login (le backend retourne directement un token)
  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  // Déconnexion : supprime le token et vide l'état (PrivateRoute redirige vers /login)
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // Met à jour le profil via l'API et rafraîchit l'état global
  const updateUser = async (data: Partial<User>) => {
    const res = await api.put('/auth/profile', data)
    setUser(res.data.user)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
