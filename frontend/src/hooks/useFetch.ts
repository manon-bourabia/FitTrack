// Hook générique pour les appels API GET — gère le chargement, les données et les erreurs
// Utilisation : const { data, loading, refetch } = useFetch<MonType>('/mon-endpoint')
import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void  // Permet de relancer la requête manuellement (après une modification)
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // useCallback évite de recréer la fonction à chaque render (évite une boucle infinie dans useEffect)
  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get<T>(url)
      .then((res) => setData(res.data))
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false))
  }, [url])

  // Lance la requête au montage du composant, et si l'url change
  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
