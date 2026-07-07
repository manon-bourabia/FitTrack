import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config'

// Instance Axios avec URL de base et timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Abandonne après 10s (réseau mobile peut être lent)
})

// Intercepteur de REQUÊTE — ajoute le token JWT au header automatiquement
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config // OBLIGATOIRE : retourner config sinon la requête est bloquée
})

// Intercepteur de RÉPONSE — gère les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

export default api
