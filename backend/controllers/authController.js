const User = require('../models/User');

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      });
    }

    // Find user by username
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      });
    }

    // Compare passwords
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      });
    }

    // Create session
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;

    // Return user data without password
    const { password: _, ...userData } = user;

    res.status(200).json({
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during login'
    });
  }
};

// Logout user
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Could not log out, please try again'
      });
    }
    
    res.clearCookie('connect.sid'); // Clear session cookie
    res.status(200).json({
      message: 'Logout successful'
    });
  });
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user data'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser
};