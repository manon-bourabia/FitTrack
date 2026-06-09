// ============================================================
// controllers/stats.controller.js — Statistiques de progression
//
// Ce contrôleur est volontairement simple : il n'a qu'une seule
// responsabilité — agréger les stats de l'utilisateur connecté
// et les retourner en une seule réponse JSON structurée.
// ============================================================

const WorkoutModel = require('../models/workout.model');
const UserModel = require('../models/user.model');

const StatsController = {

  // ---- GET /api/stats/progression ----
  // Retourne les statistiques complètes de l'utilisateur : résumé global,
  // historique mensuel, répartition par catégorie, et séances récentes.
  async getProgression(req, res) {
    try {
      // Promise.all([...]) exécute plusieurs requêtes asynchrones EN PARALLÈLE.
      // Au lieu d'attendre la fin de la première pour lancer la seconde
      // (ce qui prendrait 2× plus de temps), les deux s'exécutent simultanément.
      // La destructuration [stats, user] récupère les résultats dans l'ordre.
      const [stats, user] = await Promise.all([
        WorkoutModel.getProgressionStats(req.user.id), // 4 requêtes SQL en une
        UserModel.findById(req.user.id),               // 1 requête SQL
      ]);

      // On retourne les infos utilisateur utiles pour l'affichage du profil
      // (sans le mot de passe — findById le filtre déjà côté modèle)
      res.json({
        user: {
          username: user.username,
          weight: user.weight,
          goal: user.goal,
          member_since: user.created_at, // Date d'inscription pour "Membre depuis"
        },
        stats, // Contient summary, monthly, byCategory, recent
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Failed to fetch stats.' });
    }
  },
};

module.exports = StatsController;