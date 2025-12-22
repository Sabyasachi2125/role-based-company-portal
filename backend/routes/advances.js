const express = require('express');
const router = express.Router();
const { 
  createAdvance, 
  getAllAdvances, 
  getAdvanceById, 
  updateAdvance, 
  deleteAdvance 
} = require('../controllers/advanceController');

// POST /api/advances - Create a new advance
router.post('/', createAdvance);

// GET /api/advances - Get all advances
router.get('/', getAllAdvances);

// GET /api/advances/:id - Get advance by ID
router.get('/:id', getAdvanceById);

// PUT /api/advances/:id - Update advance (admin only)
router.put('/:id', updateAdvance);

// DELETE /api/advances/:id - Delete advance (admin only)
router.delete('/:id', deleteAdvance);

module.exports = router;