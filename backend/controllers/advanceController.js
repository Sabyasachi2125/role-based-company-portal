const Advance = require('../models/Advance');

// Create a new advance
const createAdvance = async (req, res) => {
  try {
    const { employee_id, advance_amount, date, remaining_due } = req.body;
    
    // Validate input
    if (!employee_id || !advance_amount || !date || remaining_due === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Employee ID, advance amount, date, and remaining due are required'
      });
    }
    
    // Employees can only create advances for themselves
    if (req.session.role !== 'admin' && parseInt(employee_id) !== req.session.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only create advances for yourself'
      });
    }
    
    // Create advance
    const advanceId = await Advance.create(req.body, req.session.userId);
    
    res.status(201).json({
      message: 'Advance created successfully',
      advanceId
    });
  } catch (error) {
    console.error('Create advance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating the advance'
    });
  }
};

// Get all advances
const getAllAdvances = async (req, res) => {
  try {
    const advances = await Advance.getAll(req.session.userId, req.session.role);
    
    res.status(200).json({
      advances
    });
  } catch (error) {
    console.error('Get advances error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching advances'
    });
  }
};

// Get advance by ID
const getAdvanceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const advance = await Advance.getById(id);
    
    if (!advance) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Advance not found'
      });
    }
    
    // Check if employee is trying to access someone else's record
    if (req.session.role !== 'admin' && advance.employee_id !== req.session.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this advance'
      });
    }
    
    res.status(200).json({
      advance
    });
  } catch (error) {
    console.error('Get advance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the advance'
    });
  }
};

// Update advance (admin only)
const updateAdvance = async (req, res) => {
  try {
    // Check if user is admin
    if (req.session.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can update advances'
      });
    }
    
    const { id } = req.params;
    const { employee_id, advance_amount, date, remaining_due } = req.body;
    
    // Validate input
    if (!employee_id || !advance_amount || !date || remaining_due === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Employee ID, advance amount, date, and remaining due are required'
      });
    }
    
    // Check if advance exists
    const existingAdvance = await Advance.getById(id);
    if (!existingAdvance) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Advance not found'
      });
    }
    
    // Update advance
    const updated = await Advance.update(id, req.body, req.session.userId);
    
    if (!updated) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update advance'
      });
    }
    
    res.status(200).json({
      message: 'Advance updated successfully'
    });
  } catch (error) {
    console.error('Update advance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating the advance'
    });
  }
};

// Delete advance (admin only)
const deleteAdvance = async (req, res) => {
  try {
    // Check if user is admin
    if (req.session.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can delete advances'
      });
    }
    
    const { id } = req.params;
    
    // Check if advance exists
    const existingAdvance = await Advance.getById(id);
    if (!existingAdvance) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Advance not found'
      });
    }
    
    // Delete advance
    const deleted = await Advance.delete(id, req.session.userId);
    
    if (!deleted) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete advance'
      });
    }
    
    res.status(200).json({
      message: 'Advance deleted successfully'
    });
  } catch (error) {
    console.error('Delete advance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting the advance'
    });
  }
};

module.exports = {
  createAdvance,
  getAllAdvances,
  getAdvanceById,
  updateAdvance,
  deleteAdvance
};