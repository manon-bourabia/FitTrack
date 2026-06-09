const pool = require('../config/database');
const bcrypt = require('bcrypt');

const UserModel = {

  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM User WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, weight, goal, created_at, updated_at FROM User WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async create({ username, email, password, weight, goal }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO User (username, email, password, weight, goal) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, weight || null, goal || 'maintain']
    );
    return result.insertId;
  },

  async update(id, { username, email, weight, goal }) {
    const fields = [];
    const values = [];
    if (username !== undefined) { fields.push('username = ?'); values.push(username); }
    if (email    !== undefined) { fields.push('email = ?');    values.push(email); }
    if (weight   !== undefined) { fields.push('weight = ?');   values.push(weight); }
    if (goal     !== undefined) { fields.push('goal = ?');     values.push(goal); }
    if (!fields.length) return this.findById(id);
    values.push(id);
    await pool.execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = UserModel;
