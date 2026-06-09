// Instance Axios centralisée — toutes les requêtes API passent par ici
import axios from 'axios'

// baseURL '/api' + proxy Vite → redirige vers http://backend:5000
const api = axios.create({ baseURL: '/api' })

// Avant chaque requête : ajoute le token JWT dans le header si l'utilisateur est connecté
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Après chaque réponse : si 401 avec un token existant = session expirée → déconnexion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
