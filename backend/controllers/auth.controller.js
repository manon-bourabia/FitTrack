// Contrôleur auth — gère l'inscription, la connexion et le profil utilisateur
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/user.model');

// Génère un token JWT contenant l'id, l'email et le username (valable 7 jours)
const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const AuthController = {

  // POST /api/auth/register — crée un compte et retourne un token
  async register(req, res) {
    try {
      const { username, email, password, weight, goal } = req.body;

      if (!username || !email || !password)
        return res.status(400).json({ error: 'Username, email and password are required.' });

      if (password.length < 6)
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });

      if (await UserModel.findByEmail(email))
        return res.status(409).json({ error: 'Email already in use.' });

      if (await UserModel.findByUsername(username))
        return res.status(409).json({ error: 'Username already taken.' });

      const userId = await UserModel.create({ username, email, password, weight, goal });
      const user   = await UserModel.findById(userId);

      res.status(201).json({ message: 'Account created successfully.', token: generateToken(user), user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  },

  // POST /api/auth/login — vérifie les identifiants et retourne un token
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ error: 'Email and password are required.' });

      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

      const isValid = await UserModel.verifyPassword(password, user.password);
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });

      // On exclut le mot de passe de la réponse
      const { password: _, ...userWithoutPassword } = user;
      res.json({ message: 'Login successful.', token: generateToken(user), user: userWithoutPassword });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  // GET /api/auth/me — retourne le profil de l'utilisateur connecté (req.user injecté par authMiddleware)
  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch profile.' });
    }
  },

  // PUT /api/auth/profile — met à jour le profil (username, email, poids, objectif)
  async updateProfile(req, res) {
    try {
      const { username, email, weight, goal } = req.body;

      if (goal && !['lose', 'maintain', 'gain'].includes(goal))
        return res.status(400).json({ error: 'Invalid goal value.' });

      const updated = await UserModel.update(req.user.id, { username, email, weight, goal });
      if (!updated) return res.status(404).json({ error: 'User not found.' });

      res.json({ message: 'Profile updated.', user: updated });
    } catch (err) {
      console.error('UpdateProfile error:', err);
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(409).json({ error: 'Username or email already in use.' });
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  },
};

module.exports = AuthController;
