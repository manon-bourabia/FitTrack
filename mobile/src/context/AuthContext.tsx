import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../services/api'
import { User } from '../types'

interface RegisterData {
  username: string
  email: string
  password: string
  goal: 'lose' | 'maintain' | 'gain'
  weight?: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

// createContext crée un "canal" de communication entre composants
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // true au démarrage

  // useEffect [] = s'exécute UNE SEULE FOIS au montage
  // Vérifie si un token est sauvegardé depuis la dernière session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        if (token) {
          // Vérifie que le token est encore valide
          const res = await api.get('/auth/me')
          setUser(res.data.user)
        }
      } catch {
        // Token expiré ou invalide → supprime du stockage
        await AsyncStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    await AsyncStorage.setItem('token', res.data.token)
    setUser(res.data.user) // Déclenche la navigation vers AppTabs
  }

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data)
    await AsyncStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  const logout = async () => {
    await AsyncStorage.removeItem('token')
    setUser(null) // Déclenche la navigation vers Login
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personnalisé — simplifie l'usage du contexte dans les écrans
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
