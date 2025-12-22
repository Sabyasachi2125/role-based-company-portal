const express = require('express');
const router = express.Router();
const { 
  createTransaction, 
  getAllTransactions, 
  getTransactionById, 
  updateTransaction, 
  deleteTransaction 
} = require('../controllers/transactionController');

// POST /api/transactions - Create a new transaction
router.post('/', createTransaction);

// GET /api/transactions - Get all transactions
router.get('/', getAllTransactions);

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', getTransactionById);

// PUT /api/transactions/:id - Update transaction (admin only)
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction (admin only)
router.delete('/:id', deleteTransaction);

module.exports = router;