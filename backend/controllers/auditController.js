const AuditLog = require('../models/AuditLog');

// Get audit logs for the current user
const getUserAuditLogs = async (req, res) => {
  try {
    const userId = req.session.userId;
    const auditLogs = await AuditLog.getByUserId(userId);
    
    res.status(200).json({
      auditLogs
    });
  } catch (error) {
    console.error('Get user audit logs error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching audit logs'
    });
  }
};

// Get audit logs for a specific record
const getRecordAuditLogs = async (req, res) => {
  try {
    const { table_name, record_id } = req.params;
    const auditLogs = await AuditLog.getByRecord(table_name, record_id);
    
    res.status(200).json({
      auditLogs
    });
  } catch (error) {
    console.error('Get record audit logs error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching audit logs'
    });
  }
};

module.exports = {
  getUserAuditLogs,
  getRecordAuditLogs
};