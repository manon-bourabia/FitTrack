const express = require('express');
const router = express.Router();
const WeightController = require('../controllers/weight.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Toutes les routes sont protégées (JWT requis)
router.get('/',      authMiddleware, WeightController.getAll);
router.post('/',     authMiddleware, WeightController.create);
router.delete('/:id', authMiddleware, WeightController.remove);

module.exports = router;
