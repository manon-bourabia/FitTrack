// ============================================================
// pages/Login.tsx — Page de connexion
//
// Composant de page React : rendu par React Router quand l'URL est /login.
// Gère un formulaire contrôlé, un appel API asynchrone, et la navigation
// programmatique vers /dashboard après une connexion réussie.
// ============================================================

// FormEvent : type de l'événement <form onSubmit>
import { useState, FormEvent } from 'react'
// Link : lien interne React Router (pas de rechargement de page)
// useNavigate : hook pour naviguer programmatiquement (navigate('/dashboard'))
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
// toast : notifications UI non-bloquantes (succès/erreur en bas d'écran)
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  // On récupère la fonction login depuis le contexte global
  const { login } = useAuth()
  const navigate = useNavigate()

  // ---- État local du formulaire (composants contrôlés) ----
  // En React, un "composant contrôlé" est un input dont value est liée
  // à un état (useState). Chaque frappe met à jour l'état via onChange.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // loading : désactive le bouton pendant l'appel API (évite les double-soumissions)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    // e.preventDefault() empêche le rechargement de page par défaut du navigateur
    e.preventDefault()
    setLoading(true)
    try {
      // login() est une fonction async qui fait POST /api/auth/login
      // et met à jour le contexte si succès (stocke le token + user)
      await login(email, password)
      navigate('/dashboard') // Redirection après connexion réussie
    } catch (err: unknown) {
      // Extraction du message d'erreur envoyé par l'API dans err.response.data.error
      // La chaîne de checks (instanceof + 'response' in err) est nécessaire car
      // TypeScript ne connaît pas la structure d'une erreur Axios
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      toast.error(message || 'Email ou mot de passe incorrect')
    } finally {
      // finally s'exécute toujours (succès ou erreur) → on remet loading à false
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4">
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">FitTrack</h1>
          <p className="text-slate-400 text-sm mt-1">Connecte-toi à ton espace</p>
        </div>

        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6">
          {/* onSubmit sur le formulaire (pas onClick sur le bouton) :
              permet aussi la soumission via la touche Entrée */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              {/* Input contrôlé : value liée à l'état + onChange qui le met à jour */}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="ton@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* disabled={loading} : empêche de cliquer plusieurs fois pendant l'appel API */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {/* Rendu conditionnel du texte selon l'état de chargement */}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Pas de compte ?{' '}
            {/* Link remplace <a href> : navigation sans rechargement de page */}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}