const express = require('express');
const router = express.Router();
const { login, logout, getCurrentUser } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// POST /api/auth/login - Login user
router.post('/login', login);

// POST /api/auth/logout - Logout user
router.post('/logout', logout);

// GET /api/auth/me - Get current user
router.get('/me', isAuthenticated, getCurrentUser);

module.exports = router;