const Bill = require('../models/Bill');

// Create a new bill
const createBill = async (req, res) => {
  try {
    const { bill_number, vendor_name, date, amount } = req.body;
    
    // Validate input
    if (!bill_number || !vendor_name || !date || !amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Bill number, vendor name, date, and amount are required'
      });
    }
    
    // Check if bill number already exists
    const existingBill = await Bill.getById(bill_number);
    if (existingBill) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Bill with this number already exists'
      });
    }
    
    // Create bill
    const billId = await Bill.create(req.body, req.session.userId);
    
    res.status(201).json({
      message: 'Bill created successfully',
      billId
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating the bill'
    });
  }
};

// Get all bills
const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.getAll(req.session.userId, req.session.role);
    
    res.status(200).json({
      bills
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching bills'
    });
  }
};

// Get bill by ID
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bill = await Bill.getById(id);
    
    if (!bill) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found'
      });
    }
    
    // Check if employee is trying to access someone else's record
    if (req.session.role !== 'admin' && bill.entered_by !== req.session.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this bill'
      });
    }
    
    res.status(200).json({
      bill
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the bill'
    });
  }
};

// Update bill (admin only)
const updateBill = async (req, res) => {
  try {
    // Check if user is admin
    if (req.session.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can update bills'
      });
    }
    
    const { id } = req.params;
    const { bill_number, vendor_name, date, amount, status } = req.body;
    
    // Validate input
    if (!bill_number || !vendor_name || !date || !amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Bill number, vendor name, date, and amount are required'
      });
    }
    
    // Check if bill exists
    const existingBill = await Bill.getById(id);
    if (!existingBill) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found'
      });
    }
    
    // Update bill
    const updated = await Bill.update(id, req.body, req.session.userId);
    
    if (!updated) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update bill'
      });
    }
    
    res.status(200).json({
      message: 'Bill updated successfully'
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating the bill'
    });
  }
};

// Delete bill (admin only)
const deleteBill = async (req, res) => {
  try {
    // Check if user is admin
    if (req.session.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can delete bills'
      });
    }
    
    const { id } = req.params;
    
    // Check if bill exists
    const existingBill = await Bill.getById(id);
    if (!existingBill) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found'
      });
    }
    
    // Delete bill
    const deleted = await Bill.delete(id, req.session.userId);
    
    if (!deleted) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete bill'
      });
    }
    
    res.status(200).json({
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting the bill'
    });
  }
};

module.exports = {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill
};