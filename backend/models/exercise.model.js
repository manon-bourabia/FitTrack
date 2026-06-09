// Modèle Exercise — toutes les requêtes SQL liées aux exercices
const pool = require('../config/database');

const ExerciseModel = {

  // Retourne tous les exercices, avec filtres optionnels par catégorie et/ou recherche textuelle
  async findAll({ category, search } = {}) {
    let query = 'SELECT * FROM Exercise';
    const params = [], conditions = [];

    if (category) { conditions.push('category = ?'); params.push(category); }
    if (search) {
      conditions.push('(name LIKE ? OR muscle_group LIKE ? OR description LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY category, name';

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  // Retourne un exercice par id (null si introuvable)
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM Exercise WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Crée un exercice et retourne l'objet créé
  async create({ name, category, muscle_group, description }) {
    const [result] = await pool.execute(
      'INSERT INTO Exercise (name, category, muscle_group, description) VALUES (?, ?, ?, ?)',
      [name, category, muscle_group || null, description || null]
    );
    return this.findById(result.insertId);
  },

  // Met à jour uniquement les champs fournis
  async update(id, { name, category, muscle_group, description }) {
    const fields = [], values = [];
    if (name         !== undefined) { fields.push('name = ?');         values.push(name); }
    if (category     !== undefined) { fields.push('category = ?');     values.push(category); }
    if (muscle_group !== undefined) { fields.push('muscle_group = ?'); values.push(muscle_group); }
    if (description  !== undefined) { fields.push('description = ?');  values.push(description); }
    if (!fields.length) return this.findById(id);
    values.push(id);
    await pool.execute(`UPDATE Exercise SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  // Supprime un exercice — échoue si l'exercice est utilisé dans une séance (FK RESTRICT)
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM Exercise WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = ExerciseModel;
