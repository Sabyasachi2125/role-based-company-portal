const db = require('../config/db');

class AuditLog {
  // Create a new audit log entry
  static async create(auditData) {
    try {
      const { user_id, action, table_name, record_id, old_values, new_values } = auditData;
      
      const [result] = await db.execute(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, action, table_name, record_id, old_values, new_values]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating audit log: ${error.message}`);
    }
  }

  // Get audit logs for a specific user
  static async getByUserId(userId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching audit logs: ${error.message}`);
    }
  }

  // Get audit logs for a specific record
  static async getByRecord(table_name, record_id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM audit_logs WHERE table_name = ? AND record_id = ? ORDER BY timestamp DESC',
        [table_name, record_id]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching audit logs: ${error.message}`);
    }
  }
}

module.exports = AuditLog;