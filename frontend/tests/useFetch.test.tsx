// ============================================================
// tests/useFetch.test.tsx — Tests du hook useFetch
//
// useFetch est un hook asynchrone : il déclenche un appel API
// et met à jour son état (loading/data/error) selon le résultat.
// On mocke api.get pour contrôler les réponses sans vrai serveur.
//
// Outils spécifiques :
//   - waitFor : attend qu'une assertion devienne vraie (async)
//   - act : wrapping obligatoire pour les mises à jour d'état dans les tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
// act : enveloppe les actions qui déclenchent des mises à jour d'état React
import { renderHook, waitFor } from '@testing-library/react'
import { useFetch } from '../hooks/useFetch'
import api from '../services/api'

// ---- Mock de l'instance Axios ----
// On remplace api.get par un mock pour éviter de vraies requêtes HTTP
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

// vi.mocked() : typage TypeScript du mock (infère les types corrects)
const mockGet = vi.mocked(api.get)

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('démarre en état de chargement (loading: true, data: null, error: null)', () => {
    // new Promise(() => {}) : promesse qui ne se résout jamais
    // → le hook reste bloqué dans l'état loading
    mockGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useFetch<{ items: number[] }>('/test'))

    // Vérification SYNCHRONE : pas besoin de waitFor car on teste l'état initial
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('retourne les données après un appel API réussi', async () => {
    const responseData = { items: [1, 2, 3] }
    // mockResolvedValue : la promesse se résout avec { data: responseData }
    mockGet.mockResolvedValue({ data: responseData })

    const { result } = renderHook(() => useFetch<{ items: number[] }>('/test'))

    // waitFor : boucle jusqu'à ce que l'assertion soit vraie (ou timeout)
    // Nécessaire car useFetch est asynchrone
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(responseData)
    expect(result.current.error).toBeNull()
    // Vérifie que api.get a bien été appelé avec la bonne URL
    expect(mockGet).toHaveBeenCalledWith('/test')
  })

  it("retourne une erreur en cas d'échec de l'appel API", async () => {
    // mockRejectedValue : la promesse est rejetée (simule une erreur réseau/API)
    mockGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useFetch<unknown>('/test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Le hook retourne le message d'erreur générique défini dans useFetch
    expect(result.current.error).toBe('Impossible de charger les données')
    expect(result.current.data).toBeNull()
  })

  it('refetch déclenche un nouvel appel API', async () => {
    mockGet.mockResolvedValue({ data: { count: 1 } })

    const { result } = renderHook(() => useFetch<{ count: number }>('/test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Premier appel au montage
    expect(mockGet).toHaveBeenCalledTimes(1)

    // On appelle refetch() directement — waitFor() gère l'attente des mises à jour
    result.current.refetch()

    // Attend le deuxième appel
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2)
    })
  })

  it('remet loading à true lors du refetch', async () => {
    mockGet.mockResolvedValue({ data: { count: 1 } })

    const { result } = renderHook(() => useFetch<{ count: number }>('/test'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Pour le second appel, on simule un chargement infini
    mockGet.mockReturnValue(new Promise(() => {}))

    result.current.refetch()

    // Vérification synchrone immédiate : loading doit être repassé à true
    await waitFor(() => expect(result.current.loading).toBe(true))
  })

  it('appelle api.get avec la bonne URL', async () => {
    mockGet.mockResolvedValue({ data: {} })

    renderHook(() => useFetch('/stats/progression'))

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/stats/progression')
    })
  })
})