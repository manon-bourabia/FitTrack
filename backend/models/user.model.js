const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Coût du hachage : 10 = bon équilibre sécurité/performance

const UserModel = {

  async create({ username, email, password, weight, goal }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.execute(
      'INSERT INTO User (username, email, password, weight, goal) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, weight || null, goal || 'maintain']
    );

    return result.insertId;
  },

  // Utilisée à la connexion : on a besoin du mot de passe hashé → SELECT *
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  // Utilisée pour les réponses API : password volontairement exclu du SELECT
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, email, weight, goal, created_at FROM User WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // Utilisée à l'inscription pour vérifier qu'un pseudo n'est pas déjà pris
  async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT id FROM User WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  // Mise à jour partielle : seuls les champs fournis sont modifiés
  async update(id, { username, weight, goal }) {
    const fields = [];
    const values = [];

    if (username !== undefined) { fields.push('username = ?'); values.push(username); }
    if (weight !== undefined) { fields.push('weight = ?'); values.push(weight); }
    if (goal !== undefined) { fields.push('goal = ?'); values.push(goal); }

    if (fields.length === 0) return null;

    values.push(id);
    await db.execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  // bcrypt.compare hash le mot de passe saisi et le compare au hash stocké
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

module.exports = UserModel;