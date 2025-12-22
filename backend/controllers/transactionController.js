const Transaction = require('../models/Transaction');
const { isAdmin } = require('../middleware/auth');

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { transaction_id, date, description, amount } = req.body;
    
    // Validate input
    if (!transaction_id || !date || !amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Transaction ID, date, and amount are required'
      });
    }
    
    // Check if transaction ID already exists
    const existingTransaction = await Transaction.getById(transaction_id);
    if (existingTransaction) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Transaction with this ID already exists'
      });
    }
    
    // Create transaction
    const transactionId = await Transaction.create(req.body, req.session.userId);
    
    res.status(201).json({
      message: 'Transaction created successfully',
      transactionId
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating the transaction'
    });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAll(req.session.userId, req.session.role);
    
    res.status(200).json({
      transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching transactions'
    });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.getById(id);
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Transaction not found'
      });
    }
    
    // Check if employee is trying to access someone else's record
    if (req.session.role !== 'admin' && transaction.entered_by !== req.session.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this transaction'
      });
    }
    
    res.status(200).json({
      transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the transaction'
    });
  }
};

// Update transaction (admin only)
const updateTransaction = async (req, res) => {
  try {
    // Check if user is admin
    if (req.session.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can update transactions'
      });
    }
    
    const { id } = req.params;
    const { transaction_id, date, description, amount } = req.body;
    
    // Validate input
    if (!transaction_id || !date || !amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Transaction ID, date, and amount are required'
      });
    }
    
    // Check if transaction exists
    const existingTransaction = await Transaction.getById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Transaction not found'
      });
    }
    
    // Update transaction
    const updated = await Transaction.update(id, req.body, req.session.userId);
    
    if (!updated) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update transaction'
      });
    }
    
    res.status(200).json({
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating the transaction'
    });
  }
};

// Delete transaction (admin only)
const deleteTransaction = async (req, res) => {
  try {
    // Check if user is admin
    if (req.session.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can delete transactions'
      });
    }
    
    const { id } = req.params;
    
    // Check if transaction exists
    const existingTransaction = await Transaction.getById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Transaction not found'
      });
    }
    
    // Delete transaction
    const deleted = await Transaction.delete(id, req.session.userId);
    
    if (!deleted) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete transaction'
      });
    }
    
    res.status(200).json({
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting the transaction'
    });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};