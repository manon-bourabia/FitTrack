// ============================================================
// tests/workouts.test.js — Tests d'intégration des routes de séances
//
// On teste les cas fondamentaux : liste, création, validation,
// et suppression. Les routes de gestion d'exercices dans une séance
// (addExercise, updateExercise, removeExercise) ne sont pas couvertes
// ici pour rester concis ; la logique est similaire.
// ============================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  query: jest.fn(),
}));

// On mocke toutes les méthodes de WorkoutModel utilisées par le contrôleur
jest.mock('../models/workout.model', () => ({
  findAllByUser: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  addExercise: jest.fn(),
  updateExercise: jest.fn(),
  removeExercise: jest.fn(),
  replaceExercises: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getProgressionStats: jest.fn(),
}));

const app = require('../server');
const WorkoutModel = require('../models/workout.model');

// Génère le header { Authorization: 'Bearer <token>' } pour chaque test
const authHeader = () => ({
  Authorization: `Bearer ${jwt.sign(
    { id: 1, email: 'test@example.com', username: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )}`,
});

// Séance de référence : user_id: 1 correspond à l'utilisateur du token
const BASE_WORKOUT = {
  id: 1,
  user_id: 1,
  title: 'Séance du lundi',
  date: '2024-01-15',
  duration: 60,
  notes: null,
  created_at: '2024-01-15T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z',
  exercises: [], // findById retourne toujours le champ exercises
};

describe('Workout Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================================================
  describe('GET /api/workouts', () => {
  // ==================================================

    it("retourne les séances de l'utilisateur (200)", async () => {
      // findAllByUser est appelé avec req.user.id (= 1 dans le token)
      WorkoutModel.findAllByUser.mockResolvedValue([BASE_WORKOUT]);

      const res = await request(app)
        .get('/api/workouts')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('workouts');
      expect(res.body.count).toBe(1);
      expect(res.body.workouts[0].title).toBe('Séance du lundi');
    });

    it('retourne 401 sans token', async () => {
      // authMiddleware bloque avant d'atteindre le contrôleur
      const res = await request(app).get('/api/workouts');

      expect(res.status).toBe(401);
    });

    it('retourne un tableau vide si aucune séance', async () => {
      // [] = l'utilisateur n'a pas encore de séances → réponse valide (pas 404)
      WorkoutModel.findAllByUser.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/workouts')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.workouts).toEqual([]); // toEqual compare les valeurs (pas les références)
      expect(res.body.count).toBe(0);
    });
  });

  // ==================================================
  describe('POST /api/workouts', () => {
  // ==================================================

    it('crée une séance avec succès (201)', async () => {
      // create retourne l'id (insertId), puis findById relit la séance complète
      WorkoutModel.create.mockResolvedValue(1);
      WorkoutModel.findById.mockResolvedValue(BASE_WORKOUT);

      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({ title: 'Séance du lundi', date: '2024-01-15', duration: 60 });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Workout created.');
      expect(res.body.workout.title).toBe('Séance du lundi');
    });

    it('retourne 400 si title manquant', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({ date: '2024-01-15' }); // title absent

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title and date are required.');
    });

    it('retourne 400 si date manquante', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({ title: 'Test' }); // date absente

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title and date are required.');
    });

    it('crée une séance avec des exercices', async () => {
      WorkoutModel.create.mockResolvedValue(1);
      // addExercise ne retourne rien d'utile (on vérifie juste qu'il est appelé)
      WorkoutModel.addExercise.mockResolvedValue(undefined);
      WorkoutModel.findById.mockResolvedValue({
        ...BASE_WORKOUT,
        exercises: [{ exercise_id: 1, sets: 3, reps: 10, weight_used: 50 }],
      });

      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({
          title: 'Full body',
          date: '2024-01-15',
          exercises: [{ exercise_id: 1, sets: 3, reps: 10, weight_used: 50 }],
        });

      expect(res.status).toBe(201);
      // toHaveBeenCalledTimes(1) vérifie le nombre d'appels au mock
      // → addExercise doit avoir été appelé une seule fois (pour un exercice)
      expect(WorkoutModel.addExercise).toHaveBeenCalledTimes(1);
    });
  });

  // ==================================================
  describe('DELETE /api/workouts/:id', () => {
  // ==================================================

    it('supprime une séance avec succès (200)', async () => {
      // delete retourne une valeur truthy (affectedRows = 1)
      WorkoutModel.delete.mockResolvedValue(1);

      const res = await request(app)
        .delete('/api/workouts/1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Workout deleted.');
    });

    it("retourne 404 si la séance n'existe pas", async () => {
      // delete retourne 0 → affectedRows = 0 → séance introuvable ou pas à l'user
      WorkoutModel.delete.mockResolvedValue(0);

      const res = await request(app)
        .delete('/api/workouts/999')
        .set(authHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Workout not found.');
    });

    it('retourne 401 sans token', async () => {
      const res = await request(app).delete('/api/workouts/1');

      expect(res.status).toBe(401);
    });
  });
});