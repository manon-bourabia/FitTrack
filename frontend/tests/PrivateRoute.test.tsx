// ============================================================
// tests/PrivateRoute.test.tsx — Tests du composant PrivateRoute
//
// PrivateRoute est une "route gardienne" : son comportement dépend
// de l'état d'authentification. On teste 3 états distincts :
//   - loading: true  → affiche un spinner
//   - user: null     → redirige vers /login
//   - user: défini   → rend le contenu protégé (Outlet)
//
// On doit configurer l'arbre de routes complet (Routes + Route)
// pour que React Router puisse simuler la navigation.
// ============================================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
// MemoryRouter + Route + Routes : nécessaires pour simuler les routes imbriquées
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from '../components/Layout/PrivateRoute'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: null,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
}

const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,     // Non connecté par défaut
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

// ---- Rendu avec arbre de routes complet ----
// Structure reproduite :
//   <Route element={<PrivateRoute />}>     ← garde l'accès
//     <Route path="/dashboard" element={   ← contenu protégé
//       <div>Contenu Dashboard</div>
//     } />
//   </Route>
//   <Route path="/login" element={         ← destination de redirection
//     <div>Page Login</div>
//   } />
const renderWithRoutes = (ctx: AuthContextType, initialPath = '/dashboard') =>
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          {/* PrivateRoute comme element parent : agit comme un garde */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Contenu Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Page Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('PrivateRoute', () => {
  it('affiche le spinner pendant le chargement initial', () => {
    // loading: true → PrivateRoute retourne <LoadingSpinner />
    renderWithRoutes(makeAuthContext({ loading: true }))

    // LoadingSpinner utilise la classe 'animate-spin' — on cherche dans le DOM
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('redirige vers /login si non connecté', () => {
    // user: null + loading: false → <Navigate to="/login" replace />
    renderWithRoutes(makeAuthContext({ user: null, loading: false }))

    // Après la redirection, on doit voir la page Login
    expect(screen.getByText('Page Login')).toBeInTheDocument()
    // queryByText (au lieu de getByText) : retourne null si non trouvé, sans erreur
    expect(screen.queryByText('Contenu Dashboard')).not.toBeInTheDocument()
  })

  it('affiche le contenu protégé si connecté', () => {
    // user défini + loading: false → <Outlet /> rend le composant enfant
    renderWithRoutes(makeAuthContext({ user: mockUser, loading: false }))

    expect(screen.getByText('Contenu Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Page Login')).not.toBeInTheDocument()
  })

  it("n'affiche pas le contenu pendant le chargement", () => {
    // Même si user est défini, loading: true bloque l'affichage (spinner d'abord)
    renderWithRoutes(makeAuthContext({ loading: true, user: mockUser }))

    expect(screen.queryByText('Contenu Dashboard')).not.toBeInTheDocument()
  })
})