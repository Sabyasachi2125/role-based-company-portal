const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'company_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get a promise-based connection from the pool
const promisePool = pool.promise();

// Test the database connection
promisePool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

module.exports = promisePool;