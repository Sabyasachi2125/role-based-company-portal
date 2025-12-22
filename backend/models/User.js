const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  // Find user by username
  static async findByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, role FROM users WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Create a new user
  static async create(userData) {
    try {
      const { username, password, role } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await db.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role || 'employee']
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Error comparing passwords: ${error.message}`);
    }
  }
}

module.exports = User;