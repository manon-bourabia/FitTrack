// Design tokens — reproduit fidèlement la charte graphique du frontend web
export const Colors = {
  // Fonds (palette slate de Tailwind)
  dark: '#0F172A',          // slate-900 — fond global de l'app
  surface: '#1E293B',       // slate-800 — fond des cartes et modales
  surfaceRaised: '#273549', // légèrement plus clair (cartes surélevées)

  // Bordures
  border: '#334155',        // slate-700

  // Couleur primaire (indigo)
  primary: '#6366F1',       // indigo-500 — boutons, icônes actives
  primaryDark: '#4F46E5',   // indigo-600 — état pressé
  primaryLight: '#818CF8',  // indigo-400 — textes de lien

  // Textes
  textPrimary: '#F1F5F9',   // slate-100 — titres et valeurs importantes
  textSecondary: '#94A3B8', // slate-400 — descriptions et labels
  textMuted: '#64748B',     // slate-500 — métadonnées, dates

  // Catégories exercices
  indigo: '#6366F1',        // Musculation
  amber: '#F59E0B',         // Cardio
  emerald: '#10B981',       // Flexibilité

  // Autres
  red: '#EF4444',           // Erreurs, bouton déconnexion
  white: '#FFFFFF',
}
