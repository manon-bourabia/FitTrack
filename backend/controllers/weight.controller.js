const WeightModel = require('../models/weight.model');

const WeightController = {

  // GET /api/weight — historique complet de pesées
  async getAll(req, res) {
    try {
      const entries = await WeightModel.findAllByUser(req.user.id);
      res.json({ entries });
    } catch (err) {
      console.error('Weight getAll error:', err);
      res.status(500).json({ error: 'Failed to fetch weight history.' });
    }
  },

  // POST /api/weight — ajouter une pesée
  async create(req, res) {
    try {
      const { weight, date, note } = req.body;

      if (!weight || !date) {
        return res.status(400).json({ error: 'weight et date sont requis.' });
      }

      const parsed = parseFloat(weight);
      if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
        return res.status(400).json({ error: 'Poids invalide.' });
      }

      const id = await WeightModel.create(req.user.id, { weight: parsed, date, note });
      res.status(201).json({ message: 'Pesée enregistrée.', id });
    } catch (err) {
      console.error('Weight create error:', err);
      res.status(500).json({ error: 'Failed to save weight entry.' });
    }
  },

  // DELETE /api/weight/:id — supprimer une pesée
  async remove(req, res) {
    try {
      const deleted = await WeightModel.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: 'Pesée introuvable.' });
      res.json({ message: 'Pesée supprimée.' });
    } catch (err) {
      console.error('Weight delete error:', err);
      res.status(500).json({ error: 'Failed to delete weight entry.' });
    }
  },
};

module.exports = WeightController;
