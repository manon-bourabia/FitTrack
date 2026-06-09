// Middleware JWT — vérifie que l'utilisateur est connecté avant d'accéder aux routes protégées
// Le client envoie le token dans le header : Authorization: Bearer <token>
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Pas de token ou mauvais format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérifie la signature et la date d'expiration du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injecte l'identité de l'utilisateur dans req.user (accessible dans les controllers)
    req.user = { id: decoded.id, email: decoded.email, username: decoded.username };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
