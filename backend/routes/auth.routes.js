// Routes d'authentification — montées sous /api/auth dans server.js
const express = require('express');
const router  = express.Router();

const AuthController  = require('../controllers/auth.controller');
const authMiddleware  = require('../middleware/auth.middleware');

router.post('/register', AuthController.register);                     // Créer un compte
router.post('/login',    AuthController.login);                        // Se connecter
router.get( '/me',       authMiddleware, AuthController.me);           // Profil connecté
router.put( '/profile',  authMiddleware, AuthController.updateProfile); // Modifier le profil

module.exports = router;
