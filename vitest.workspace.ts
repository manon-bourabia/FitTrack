// Workspace vitest pour le monorepo FitTrack
// Lance uniquement les tests frontend (jsdom) depuis la racine.
// Les tests backend utilisent Jest : cd backend && npm test
// Note: pas d'import depuis 'vitest/config' car vitest n'est installé que dans frontend/
export default [
  {
    extends: './frontend/vitest.config.ts',
  },
]
