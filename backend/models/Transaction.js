const db = require('../config/db');
const AuditLog = require('./AuditLog');

class Transaction {
  // Create a new transaction
  static async create(transactionData, userId) {
    try {
      const { transaction_id, date, description, amount } = transactionData;
      
      const [result] = await db.execute(
        'INSERT INTO transactions (transaction_id, date, description, amount, entered_by) VALUES (?, ?, ?, ?, ?)',
        [transaction_id, date, description, amount, userId]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }
  }

  // Get all transactions (admin can see all, employees only their own)
  static async getAll(userId, role) {
    try {
      let query = 'SELECT t.*, u.username as entered_by_name FROM transactions t JOIN users u ON t.entered_by = u.id';
      let params = [];
      
      if (role !== 'admin') {
        query += ' WHERE t.entered_by = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY t.date DESC';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }

  // Get transaction by ID
  static async getById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT t.*, u.username as entered_by_name FROM transactions t JOIN users u ON t.entered_by = u.id WHERE t.id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  }

  // Update transaction (admin only)
  static async update(id, transactionData, userId) {
    try {
      // First, get the existing transaction to log changes
      const existingTransaction = await this.getById(id);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }
      
      const { transaction_id, date, description, amount } = transactionData;
      
      // Update transaction
      const [result] = await db.execute(
        'UPDATE transactions SET transaction_id = ?, date = ?, description = ?, amount = ? WHERE id = ?',
        [transaction_id, date, description, amount, id]
      );
      
      // Log the update in audit logs
      if (result.affectedRows > 0) {
        const oldValues = JSON.stringify({
          transaction_id: existingTransaction.transaction_id,
          date: existingTransaction.date,
          description: existingTransaction.description,
          amount: existingTransaction.amount
        });
        
        const newValues = JSON.stringify({
          transaction_id,
          date,
          description,
          amount
        });
        
        await AuditLog.create({
          user_id: userId,
          action: 'UPDATE',
          table_name: 'transactions',
          record_id: id,
          old_values: oldValues,
          new_values: newValues
        });
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }
  }

  // Delete transaction (admin only)
  static async delete(id, userId) {
    try {
      // First, get the existing transaction to log the deletion
      const existingTransaction = await this.getById(id);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }
      
      const [result] = await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
      
      // Log the deletion in audit logs
      if (result.affectedRows > 0) {
        const oldValues = JSON.stringify({
          transaction_id: existingTransaction.transaction_id,
          date: existingTransaction.date,
          description: existingTransaction.description,
          amount: existingTransaction.amount
        });
        
        await AuditLog.create({
          user_id: userId,
          action: 'DELETE',
          table_name: 'transactions',
          record_id: id,
          old_values: oldValues,
          new_values: null
        });
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting transaction: ${error.message}`);
    }
  }
}

module.exports = Transaction;