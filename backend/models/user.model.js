// Modèle User — toutes les requêtes SQL liées aux utilisateurs
const pool   = require('../config/database');
const bcrypt = require('bcrypt');

const UserModel = {

  // Cherche un utilisateur par email (retourne null si introuvable)
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM User WHERE email = ?', [email]);
    return rows[0] || null;
  },

  // Cherche un utilisateur par nom d'utilisateur
  async findByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM User WHERE username = ?', [username]);
    return rows[0] || null;
  },

  // Retourne un utilisateur par id, sans le mot de passe
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, weight, goal, created_at, updated_at FROM User WHERE id = ?', [id]
    );
    return rows[0] || null;
  },

  // Crée un utilisateur (hash le mot de passe avant l'insertion) — retourne l'id créé
  async create({ username, email, password, weight, goal }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO User (username, email, password, weight, goal) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, weight || null, goal || 'maintain']
    );
    return result.insertId;
  },

  // Met à jour les champs fournis (seuls les champs définis sont modifiés)
  async update(id, { username, email, weight, goal }) {
    const fields = [], values = [];
    if (username !== undefined) { fields.push('username = ?'); values.push(username); }
    if (email    !== undefined) { fields.push('email = ?');    values.push(email); }
    if (weight   !== undefined) { fields.push('weight = ?');   values.push(weight); }
    if (goal     !== undefined) { fields.push('goal = ?');     values.push(goal); }
    if (!fields.length) return this.findById(id);
    values.push(id);
    await pool.execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  // Compare un mot de passe en clair avec le hash stocké en base
  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = UserModel;
