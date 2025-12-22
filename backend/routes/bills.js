const express = require('express');
const router = express.Router();
const { 
  createBill, 
  getAllBills, 
  getBillById, 
  updateBill, 
  deleteBill 
} = require('../controllers/billController');

// POST /api/bills - Create a new bill
router.post('/', createBill);

// GET /api/bills - Get all bills
router.get('/', getAllBills);

// GET /api/bills/:id - Get bill by ID
router.get('/:id', getBillById);

// PUT /api/bills/:id - Update bill (admin only)
router.put('/:id', updateBill);

// DELETE /api/bills/:id - Delete bill (admin only)
router.delete('/:id', deleteBill);

module.exports = router;