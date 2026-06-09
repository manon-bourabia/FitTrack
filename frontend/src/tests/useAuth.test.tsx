// ============================================================
// tests/useAuth.test.tsx — Tests du hook useAuth
//
// Pour tester un hook React, on utilise renderHook de RTL.
// renderHook exécute le hook dans un composant factice invisible
// et expose son résultat via result.current.
//
// On vérifie :
//   1. Que le hook lève une erreur s'il est utilisé hors Provider
//   2. Qu'il retourne bien les valeurs du contexte quand bien configuré
// ============================================================

import { describe, it, expect, vi } from 'vitest'
// renderHook : exécute un hook dans un composant test invisible
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: 75,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
}

const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: mockUser,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

describe('useAuth', () => {

  it('lève une erreur si utilisé en dehors de AuthProvider', () => {
    // On réduit le bruit console pour ce test car React loggue l'erreur
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // renderHook sans wrapper = pas de Provider → useAuth() doit lancer une erreur
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider'
    )

    consoleSpy.mockRestore() // Restaure console.error pour les autres tests
  })

  it('retourne les valeurs du contexte depuis AuthProvider', () => {
    const ctx = makeAuthContext()

    // wrapper : composant qui enveloppe le hook (fournit le contexte nécessaire)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    // { result } : contient result.current = valeur retournée par le hook
    const { result } = renderHook(() => useAuth(), { wrapper })

    // toEqual : compare les valeurs en profondeur (pas les références d'objet)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.loading).toBe(false)
    // typeof vérifie que login/logout/register sont bien des fonctions
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.register).toBe('function')
  })

  it('retourne user null si non connecté', () => {
    const ctx = makeAuthContext({ user: null })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull() // toBeNull() : strictement null
  })

  it('retourne loading: true pendant le chargement', () => {
    const ctx = makeAuthContext({ loading: true })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)
  })

  it('expose les fonctions login, logout et register', () => {
    // On passe nos propres fonctions espion pour vérifier qu'elles sont bien exposées
    const login = vi.fn()
    const logout = vi.fn()
    const register = vi.fn()
    const ctx = makeAuthContext({ login, logout, register })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // toBe : vérifie la référence exacte (même fonction, pas une copie)
    expect(result.current.login).toBe(login)
    expect(result.current.logout).toBe(logout)
    expect(result.current.register).toBe(register)
  })
})