// Point d'entrée de l'API — configure Express et branche toutes les routes
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes     = require('./routes/auth.routes');
const exerciseRoutes = require('./routes/exercise.routes');
const workoutRoutes  = require('./routes/workout.routes');
const statsRoutes    = require('./routes/stats.routes');
const weightRoutes   = require('./routes/weight.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// Autorise le frontend à appeler l'API (bloqué par défaut par les navigateurs)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Permet de lire le JSON envoyé dans le corps des requêtes (req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de vérification rapide : GET /api → l'API tourne ?
app.get('/api', (req, res) => {
  res.json({ message: 'FitTrack API is running', version: '1.0.0' });
});

// Branchement des routes sous leurs préfixes respectifs
app.use('/api/auth',      authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts',  workoutRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/weight',    weightRoutes);

// Aucune route trouvée → 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Erreur inattendue → 500 (appelé avec next(err) dans les routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Ne pas démarrer le serveur pendant les tests (Supertest le gère lui-même)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitTrack API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
