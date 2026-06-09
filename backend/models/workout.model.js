// Modèle Workout — requêtes SQL pour les séances et leurs exercices
const pool = require('../config/database');

const WorkoutModel = {

  // Toutes les séances d'un utilisateur (avec le nombre d'exercices par séance)
  async findAllByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT w.*, COUNT(we.id) AS exercise_count
       FROM Workout w
       LEFT JOIN WorkoutExercise we ON we.workout_id = w.id
       WHERE w.user_id = ?
       GROUP BY w.id
       ORDER BY w.date DESC, w.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // Une séance avec la liste complète de ses exercices (via JOIN)
  // Vérifie que la séance appartient bien à userId (sécurité)
  async findById(id, userId) {
    const [workouts] = await pool.execute(
      'SELECT * FROM Workout WHERE id = ? AND user_id = ?', [id, userId]
    );
    if (!workouts[0]) return null;

    const [exercises] = await pool.execute(
      `SELECT we.id AS workout_exercise_id, we.sets, we.reps, we.weight_used,
              we.duration AS exercise_duration,
              e.id AS exercise_id, e.name, e.category, e.muscle_group, e.description
       FROM WorkoutExercise we
       JOIN Exercise e ON e.id = we.exercise_id
       WHERE we.workout_id = ?
       ORDER BY we.id`,
      [id]
    );
    return { ...workouts[0], exercises };
  },

  // Crée une séance — retourne l'id créé
  async create({ user_id, title, date, duration, notes }) {
    const [result] = await pool.execute(
      'INSERT INTO Workout (user_id, title, date, duration, notes) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, date, duration || null, notes || null]
    );
    return result.insertId;
  },

  // Met à jour les champs fournis d'une séance
  async update(id, userId, { title, date, duration, notes }) {
    const fields = [], values = [];
    if (title    !== undefined) { fields.push('title = ?');    values.push(title); }
    if (date     !== undefined) { fields.push('date = ?');     values.push(date); }
    if (duration !== undefined) { fields.push('duration = ?'); values.push(duration); }
    if (notes    !== undefined) { fields.push('notes = ?');    values.push(notes); }
    if (!fields.length) return;
    values.push(id, userId);
    await pool.execute(
      `UPDATE Workout SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values
    );
  },

  // Supprime une séance (et ses exercices en cascade via FK)
  async delete(id, userId) {
    const [result] = await pool.execute(
      'DELETE FROM Workout WHERE id = ? AND user_id = ?', [id, userId]
    );
    return result.affectedRows > 0;
  },

  // Ajoute un exercice à une séance
  async addExercise(workoutId, { exercise_id, sets, reps, weight_used, duration }) {
    const [result] = await pool.execute(
      'INSERT INTO WorkoutExercise (workout_id, exercise_id, sets, reps, weight_used, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [workoutId, exercise_id, sets || null, reps || null, weight_used || null, duration || null]
    );
    return result.insertId;
  },

  // Modifie les stats d'un exercice dans une séance (séries, répétitions, poids, durée)
  async updateExercise(weId, workoutId, { sets, reps, weight_used, duration }) {
    const fields = [], values = [];
    if (sets        !== undefined) { fields.push('sets = ?');        values.push(sets); }
    if (reps        !== undefined) { fields.push('reps = ?');        values.push(reps); }
    if (weight_used !== undefined) { fields.push('weight_used = ?'); values.push(weight_used); }
    if (duration    !== undefined) { fields.push('duration = ?');    values.push(duration); }
    if (!fields.length) return;
    values.push(weId, workoutId);
    await pool.execute(
      `UPDATE WorkoutExercise we JOIN Workout w ON w.id = we.workout_id
       SET ${fields.join(', ')} WHERE we.id = ? AND we.workout_id = ?`,
      values
    );
  },

  // Retire un exercice d'une séance
  async removeExercise(weId, workoutId) {
    const [result] = await pool.execute(
      'DELETE FROM WorkoutExercise WHERE id = ? AND workout_id = ?', [weId, workoutId]
    );
    return result.affectedRows > 0;
  },

  // Remplace tous les exercices d'une séance (supprime les anciens puis insère les nouveaux)
  async replaceExercises(workoutId, exercises) {
    await pool.execute('DELETE FROM WorkoutExercise WHERE workout_id = ?', [workoutId]);
    for (const ex of exercises) {
      if (!ex.exercise_id) continue;
      await this.addExercise(workoutId, ex);
    }
  },

  // Statistiques de progression pour le dashboard et le profil
  async getProgressionStats(userId) {
    // Résumé global : total séances, minutes, durée moyenne, exercices uniques
    const [[summary]] = await pool.execute(
      `SELECT COUNT(DISTINCT w.id)           AS total_workouts,
              COALESCE(SUM(w.duration), 0)   AS total_minutes,
              COALESCE(AVG(w.duration), 0)   AS avg_duration,
              COUNT(DISTINCT we.exercise_id) AS unique_exercises
       FROM Workout w
       LEFT JOIN WorkoutExercise we ON we.workout_id = w.id
       WHERE w.user_id = ?`,
      [userId]
    );

    // Nombre de séances par mois sur les 12 derniers mois
    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(date, '%Y-%m') AS month,
              COUNT(*)                   AS workout_count,
              COALESCE(SUM(duration), 0) AS total_minutes
       FROM Workout
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month DESC`,
      [userId]
    );

    // Répartition des exercices par catégorie (Musculation / Cardio / Flexibilité)
    const [byCategory] = await pool.execute(
      `SELECT e.category,
              COUNT(DISTINCT we.exercise_id) AS exercise_count,
              COUNT(we.id)                   AS total_sets
       FROM WorkoutExercise we
       JOIN Exercise e ON e.id  = we.exercise_id
       JOIN Workout   w ON w.id = we.workout_id
       WHERE w.user_id = ?
       GROUP BY e.category`,
      [userId]
    );

    // Les 5 séances les plus récentes
    const [recent] = await pool.execute(
      `SELECT id, title, date, duration, notes FROM Workout
       WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 5`,
      [userId]
    );

    return { summary, monthly, byCategory, recent };
  },
};

module.exports = WorkoutModel;
