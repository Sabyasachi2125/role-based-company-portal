const db = require('../config/db');
const AuditLog = require('./AuditLog');

class Bill {
  // Create a new bill
  static async create(billData, userId) {
    try {
      const { bill_number, vendor_name, date, amount, status } = billData;
      
      const [result] = await db.execute(
        'INSERT INTO bills (bill_number, vendor_name, date, amount, status, entered_by) VALUES (?, ?, ?, ?, ?, ?)',
        [bill_number, vendor_name, date, amount, status || 'Pending', userId]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating bill: ${error.message}`);
    }
  }

  // Get all bills (admin can see all, employees only their own)
  static async getAll(userId, role) {
    try {
      let query = 'SELECT b.*, u.username as entered_by_name FROM bills b JOIN users u ON b.entered_by = u.id';
      let params = [];
      
      if (role !== 'admin') {
        query += ' WHERE b.entered_by = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY b.date DESC';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching bills: ${error.message}`);
    }
  }

  // Get bill by ID
  static async getById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT b.*, u.username as entered_by_name FROM bills b JOIN users u ON b.entered_by = u.id WHERE b.id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching bill: ${error.message}`);
    }
  }

  // Update bill (admin only)
  static async update(id, billData, userId) {
    try {
      // First, get the existing bill to log changes
      const existingBill = await this.getById(id);
      if (!existingBill) {
        throw new Error('Bill not found');
      }
      
      const { bill_number, vendor_name, date, amount, status } = billData;
      
      // Update bill
      const [result] = await db.execute(
        'UPDATE bills SET bill_number = ?, vendor_name = ?, date = ?, amount = ?, status = ? WHERE id = ?',
        [bill_number, vendor_name, date, amount, status, id]
      );
      
      // Log the update in audit logs
      if (result.affectedRows > 0) {
        const oldValues = JSON.stringify({
          bill_number: existingBill.bill_number,
          vendor_name: existingBill.vendor_name,
          date: existingBill.date,
          amount: existingBill.amount,
          status: existingBill.status
        });
        
        const newValues = JSON.stringify({
          bill_number,
          vendor_name,
          date,
          amount,
          status
        });
        
        await AuditLog.create({
          user_id: userId,
          action: 'UPDATE',
          table_name: 'bills',
          record_id: id,
          old_values: oldValues,
          new_values: newValues
        });
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating bill: ${error.message}`);
    }
  }

  // Delete bill (admin only)
  static async delete(id, userId) {
    try {
      // First, get the existing bill to log the deletion
      const existingBill = await this.getById(id);
      if (!existingBill) {
        throw new Error('Bill not found');
      }
      
      const [result] = await db.execute('DELETE FROM bills WHERE id = ?', [id]);
      
      // Log the deletion in audit logs
      if (result.affectedRows > 0) {
        const oldValues = JSON.stringify({
          bill_number: existingBill.bill_number,
          vendor_name: existingBill.vendor_name,
          date: existingBill.date,
          amount: existingBill.amount,
          status: existingBill.status
        });
        
        await AuditLog.create({
          user_id: userId,
          action: 'DELETE',
          table_name: 'bills',
          record_id: id,
          old_values: oldValues,
          new_values: null
        });
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting bill: ${error.message}`);
    }
  }
}

module.exports = Bill;