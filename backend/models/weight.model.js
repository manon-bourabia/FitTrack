const db = require('../config/database');

const WeightModel = {

  // Récupère tout l'historique de pesées d'un utilisateur, du plus récent au plus ancien
  async findAllByUser(userId) {
    const [rows] = await db.execute(
      `SELECT id, weight, date, note, created_at
       FROM WeightEntry
       WHERE user_id = ?
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );
    return rows;
  },

  // Ajoute une nouvelle pesée et met à jour le champ weight de l'utilisateur
  async create(userId, { weight, date, note }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO WeightEntry (user_id, weight, date, note) VALUES (?, ?, ?, ?)`,
        [userId, weight, date, note || null]
      );

      // On garde User.weight synchronisé avec la dernière pesée
      await conn.execute(
        `UPDATE User SET weight = ? WHERE id = ?`,
        [weight, userId]
      );

      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Supprime une pesée (vérification user_id pour sécurité)
  async delete(id, userId) {
    const [result] = await db.execute(
      `DELETE FROM WeightEntry WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = WeightModel;
