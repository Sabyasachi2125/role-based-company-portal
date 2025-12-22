const db = require('../config/db');
const AuditLog = require('./AuditLog');

class Advance {
  // Create a new advance
  static async create(advanceData, userId) {
    try {
      const { employee_id, advance_amount, date, remaining_due } = advanceData;
      
      const [result] = await db.execute(
        'INSERT INTO advances (employee_id, advance_amount, date, remaining_due, entered_by) VALUES (?, ?, ?, ?, ?)',
        [employee_id, advance_amount, date, remaining_due, userId]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating advance: ${error.message}`);
    }
  }

  // Get all advances (admin can see all, employees only their own)
  static async getAll(userId, role) {
    try {
      let query = 'SELECT a.*, u.username as employee_name, e.username as entered_by_name FROM advances a JOIN users u ON a.employee_id = u.id JOIN users e ON a.entered_by = e.id';
      let params = [];
      
      if (role !== 'admin') {
        query += ' WHERE a.employee_id = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY a.date DESC';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching advances: ${error.message}`);
    }
  }

  // Get advance by ID
  static async getById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT a.*, u.username as employee_name, e.username as entered_by_name FROM advances a JOIN users u ON a.employee_id = u.id JOIN users e ON a.entered_by = e.id WHERE a.id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching advance: ${error.message}`);
    }
  }

  // Update advance (admin only)
  static async update(id, advanceData, userId) {
    try {
      // First, get the existing advance to log changes
      const existingAdvance = await this.getById(id);
      if (!existingAdvance) {
        throw new Error('Advance not found');
      }
      
      const { employee_id, advance_amount, date, remaining_due } = advanceData;
      
      // Update advance
      const [result] = await db.execute(
        'UPDATE advances SET employee_id = ?, advance_amount = ?, date = ?, remaining_due = ? WHERE id = ?',
        [employee_id, advance_amount, date, remaining_due, id]
      );
      
      // Log the update in audit logs
      if (result.affectedRows > 0) {
        const oldValues = JSON.stringify({
          employee_id: existingAdvance.employee_id,
          advance_amount: existingAdvance.advance_amount,
          date: existingAdvance.date,
          remaining_due: existingAdvance.remaining_due
        });
        
        const newValues = JSON.stringify({
          employee_id,
          advance_amount,
          date,
          remaining_due
        });
        
        await AuditLog.create({
          user_id: userId,
          action: 'UPDATE',
          table_name: 'advances',
          record_id: id,
          old_values: oldValues,
          new_values: newValues
        });
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating advance: ${error.message}`);
    }
  }

  // Delete advance (admin only)
  static async delete(id, userId) {
    try {
      // First, get the existing advance to log the deletion
      const existingAdvance = await this.getById(id);
      if (!existingAdvance) {
        throw new Error('Advance not found');
      }
      
      const [result] = await db.execute('DELETE FROM advances WHERE id = ?', [id]);
      
      // Log the deletion in audit logs
      if (result.affectedRows > 0) {
        const oldValues = JSON.stringify({
          employee_id: existingAdvance.employee_id,
          advance_amount: existingAdvance.advance_amount,
          date: existingAdvance.date,
          remaining_due: existingAdvance.remaining_due
        });
        
        await AuditLog.create({
          user_id: userId,
          action: 'DELETE',
          table_name: 'advances',
          record_id: id,
          old_values: oldValues,
          new_values: null
        });
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting advance: ${error.message}`);
    }
  }
}

module.exports = Advance;