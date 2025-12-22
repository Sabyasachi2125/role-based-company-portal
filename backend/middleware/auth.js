// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'You need to be logged in to access this resource' 
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have permission to access this resource' 
    });
  }
};

// Middleware to check if user is employee
const isEmployee = (req, res, next) => {
  if (req.session && req.session.userId && req.session.role === 'employee') {
    return next();
  } else {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have permission to access this resource' 
    });
  }
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isEmployee
};