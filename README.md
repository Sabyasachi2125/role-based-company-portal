# Company Portal

A role-based company portal for managing records, replacing Excel-based systems with a secure, scalable web application.

## Features

- **Role-Based Access Control**: Separate permissions for employees and admins
- **Record Management**: Three core registers (Transactions, Bills, Advances)
- **Secure Authentication**: Session-based auth with bcrypt password hashing
- **Data Integrity**: MySQL database with proper relationships
- **Responsive UI**: Clean, professional frontend interface

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: Express-session, Bcrypt

## User Roles

### Employee
- Login
- Add new records only
- View own submitted records
- Cannot edit or delete any existing data

### Admin
- Login
- Add, edit, delete any record
- View all employee records
- Manage users (optional)

## Modules / Registers

### 1. Transaction Register
- Transaction ID
- Date
- Description
- Amount
- Entered By (Employee ID)

### 2. Bill Register
- Bill Number
- Vendor Name
- Date
- Amount
- Status (Paid / Pending)

### 3. Advance Register
- Employee ID
- Advance Amount
- Date
- Remaining Due

## Security Features

- Role-based route protection (middleware)
- SQL injection prevention
- Password hashing with bcrypt
- Session timeout (2 hours)
- Access denial on unauthorized routes
- No hard-coded credentials
- Environment variables for secrets

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm (comes with Node.js)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd company-portal
```

### 2. Install Dependencies

Make sure you have Node.js installed on your system. Then install the project dependencies:

```bash
npm install
```
### 3. Set Up the Database

You can set up the database in two ways:

#### Option 1: Using the Python Script (Recommended)

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Update the `.env` file with your database credentials (see Environment Variables section below)

3. Test the database connection (optional but recommended):
```bash
python test_db_connection.py
```

4. Run the setup script:
```bash
python setup_database.py
```
#### Option 2: Manual SQL Import

1. Create a MySQL database:
```sql
CREATE DATABASE company_portal;
```

2. Update the `.env` file with your database credentials (see Environment Variables section below)

3. Run the database schema:
```sql
-- Use the schema from database/schema.sql
```
### 4. Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=company_portal

# Session Configuration
SESSION_SECRET=your_random_secret_key_here

# Server Configuration
PORT=3000
```

Update the `DB_USER` and `DB_PASSWORD` fields with your MySQL credentials.
### 5. Start the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Default Users

After setting up the database with the provided schema, you can log in with these credentials:

### Admin
- Username: `admin`
- Password: `admin123`

### Employees
- Username: `employee1`
- Password: `emp123`

- Username: `employee2`
- Password: `emp123`

**Note**: Please change these default passwords in a production environment.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction (admin only)
- `DELETE /api/transactions/:id` - Delete transaction (admin only)

### Bills
- `POST /api/bills` - Create bill
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get bill by ID
- `PUT /api/bills/:id` - Update bill (admin only)
- `DELETE /api/bills/:id` - Delete bill (admin only)

### Advances
- `POST /api/advances` - Create advance
- `GET /api/advances` - Get all advances
- `GET /api/advances/:id` - Get advance by ID
- `PUT /api/advances/:id` - Update advance (admin only)
- `DELETE /api/advances/:id` - Delete advance (admin only)

## Project Structure

```
company-portal/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── app.js
│   └── server.js
│
├── frontend/
│   ├── css/
│   ├── js/
│   └── index.html
│
├── database/
│   └── schema.sql
│
├── .env.example
├── README.md
└── package.json
```

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or open an issue in the repository.