// ============================================================
// tests/middleware.test.js — Tests unitaires du middleware JWT
//
// Stratégie : on crée une mini-application Express dédiée aux tests,
// avec une seule route protégée par authMiddleware. Cela permet de
// tester le middleware ISOLÉMENT, sans dépendre du reste de l'app.
// ============================================================

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth.middleware');

// ---- Fabrication d'une mini-app Express pour les tests ----
// On n'importe pas l'app principale pour éviter les effets de bord.
// Cette app n'a qu'une route GET /protected qui retourne req.user si valide.
const createApp = () => {
  const app = express();
  app.get('/protected', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });
  return app;
};

describe('Auth Middleware', () => {
  // createApp() est appelé une seule fois pour tous les tests du describe
  const app = createApp();

  // ---- Cas : aucun header Authorization ----
  it('retourne 401 sans header Authorization', async () => {
    // request(app) = Supertest : simule une requête HTTP sans serveur réel
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Access denied. No token provided.');
  });

  // ---- Cas : format invalide (pas de préfixe "Bearer ") ----
  it("retourne 401 avec un format invalide (pas de 'Bearer')", async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'invalid-token-format');
      // .set() ajoute un header HTTP à la requête simulée

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Access denied. No token provided.');
  });

  // ---- Cas : token présent mais corrompu/invalide ----
  it('retourne 401 avec un token invalide', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer this.is.totally.invalid');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token.');
  });

  // ---- Cas : token expiré ----
  // expiresIn: '-1s' génère un token dont la date d'expiration est dans le passé
  it('retourne 401 avec un token expiré', async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: 'test@example.com', username: 'testuser' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // "-1s" = expiré il y a 1 seconde
    );

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token expired. Please log in again.');
  });

  // ---- Cas : token valide → req.user doit être renseigné ----
  it('autorise avec un token valide et attache req.user', async () => {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', username: 'testuser' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // toMatchObject vérifie que l'objet contient au moins ces propriétés
    // (il peut en avoir d'autres, comme iat/exp du JWT)
    expect(res.body.user).toMatchObject({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
    });
  });
});