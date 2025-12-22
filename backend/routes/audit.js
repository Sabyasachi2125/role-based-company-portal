const express = require('express');
const router = express.Router();
const { 
  getUserAuditLogs,
  getRecordAuditLogs
} = require('../controllers/auditController');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/audit/user - Get audit logs for the current user
router.get('/user', isAuthenticated, getUserAuditLogs);

// GET /api/audit/:table_name/:record_id - Get audit logs for a specific record
router.get('/:table_name/:record_id', isAuthenticated, getRecordAuditLogs);

module.exports = router;