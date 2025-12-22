// API Base URL
const API_BASE_URL = '/api';

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const transactionsSection = document.getElementById('transactions-section');
const billsSection = document.getElementById('bills-section');
const advancesSection = document.getElementById('advances-section');
const sidebar = document.getElementById('sidebar');
const topUserInfo = document.getElementById('top-user-info');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');

// State
let currentUser = null;
let currentSection = 'dashboard';
let toastTimeout = null;
let auditCheckInterval = null;
let lastAuditCheck = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

// Check authentication status on page load
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
            // Start checking for audit notifications if user is employee
            if (currentUser.role === 'employee') {
                startAuditCheck();
            }
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showLogin();
    }
}

// Start checking for audit notifications
function startAuditCheck() {
    // Check for new audit logs every 30 seconds
    auditCheckInterval = setInterval(checkForAuditNotifications, 30000);
    // Also check immediately
    checkForAuditNotifications();
}

// Stop checking for audit notifications
function stopAuditCheck() {
    if (auditCheckInterval) {
        clearInterval(auditCheckInterval);
        auditCheckInterval = null;
    }
}

// Check for audit notifications
async function checkForAuditNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/audit/user`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const auditLogs = data.auditLogs || [];
            
            // Filter for recent audit logs (since last check or last 5 minutes)
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            
            const recentAudits = auditLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                // If we have a last check time, use it; otherwise use 5 minutes ago
                const checkTime = lastAuditCheck || fiveMinutesAgo;
                return logTime > checkTime;
            });
            
            // Update last check time
            lastAuditCheck = now;
            
            // Show notifications for recent audits
            recentAudits.forEach(log => {
                if (log.action === 'UPDATE') {
                    showToast(`One of your ${log.table_name} records has been updated by an admin`, 'info');
                } else if (log.action === 'DELETE') {
                    showToast(`One of your ${log.table_name} records has been deleted by an admin`, 'warning');
                }
            });
        }
    } catch (error) {
        console.error('Error checking audit notifications:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');
        
        await loginUser(username, password);
    });
    
    // Modal event listeners
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    if (modalCancel) {
        modalCancel.addEventListener('click', hideModal);
    }
    
    if (modalConfirm) {
        modalConfirm.addEventListener('click', () => {
            if (window.confirmAction) {
                window.confirmAction();
            }
            hideModal();
        });
    }
}

// Login user
async function loginUser(username, password) {
    try {
        // Disable login button and show loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> Logging in...';
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showDashboard();
            showToast('Login successful!', 'success');
            // Start checking for audit notifications if user is employee
            if (currentUser.role === 'employee') {
                startAuditCheck();
            }
        } else {
            showMessage(loginMessage, data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(loginMessage, 'An error occurred during login', 'error');
    } finally {
        // Re-enable login button
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login';
    }
}

// Logout user
async function logoutUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            currentUser = null;
            showLogin();
            showToast('You have been logged out', 'info');
            // Stop checking for audit notifications
            stopAuditCheck();
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Show login screen
function showLogin() {
    // Hide all sections
    hideAllSections();
    
    // Show login section
    loginSection.classList.remove('hidden');
    
    // Clear sidebar and user info
    sidebar.innerHTML = '';
    topUserInfo.innerHTML = '';
    
    // Reset form
    loginForm.reset();
    clearMessage(loginMessage);
    
    // Stop checking for audit notifications
    stopAuditCheck();
}

// Show dashboard
function showDashboard() {
    currentSection = 'dashboard';
    
    // Hide all sections
    hideAllSections();
    
    // Show dashboard section
    dashboardSection.classList.remove('hidden');
    
    // Setup navigation
    setupNavigation();
    
    // Setup user info
    setupUserInfo();
    
    // Load dashboard content
    loadDashboardContent();
    
    // Highlight active nav item
    highlightActiveNavItem('dashboard');
}

// Show transactions section
function showTransactions() {
    currentSection = 'transactions';
    
    // Hide all sections
    hideAllSections();
    
    // Show transactions section
    transactionsSection.classList.remove('hidden');
    
    // Load transactions content
    loadTransactionsContent();
    
    // Highlight active nav item
    highlightActiveNavItem('transactions');
}

// Show bills section
function showBills() {
    currentSection = 'bills';
    
    // Hide all sections
    hideAllSections();
    
    // Show bills section
    billsSection.classList.remove('hidden');
    
    // Load bills content
    loadBillsContent();
    
    // Highlight active nav item
    highlightActiveNavItem('bills');
}

// Show advances section
function showAdvances() {
    currentSection = 'advances';
    
    // Hide all sections
    hideAllSections();
    
    // Show advances section
    advancesSection.classList.remove('hidden');
    
    // Load advances content
    loadAdvancesContent();
    
    // Highlight active nav item
    highlightActiveNavItem('advances');
}

// Hide all sections
function hideAllSections() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    transactionsSection.classList.add('hidden');
    billsSection.classList.add('hidden');
    advancesSection.classList.add('hidden');
}

// Setup navigation based on user role
function setupNavigation() {
    let navHtml = `
        <ul class="sidebar-nav">
            <li class="sidebar-nav-item">
                <a href="#" class="sidebar-nav-link" data-target="dashboard" onclick="showDashboard()">
                    <span class="nav-icon">📊</span>
                    <span class="nav-text">Dashboard</span>
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="#" class="sidebar-nav-link" data-target="transactions" onclick="showTransactions()">
                    <span class="nav-icon">💳</span>
                    <span class="nav-text">Transactions</span>
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="#" class="sidebar-nav-link" data-target="bills" onclick="showBills()">
                    <span class="nav-icon">🧾</span>
                    <span class="nav-text">Bills</span>
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="#" class="sidebar-nav-link" data-target="advances" onclick="showAdvances()">
                    <span class="nav-icon">💰</span>
                    <span class="nav-text">Advances</span>
                </a>
            </li>
        </ul>
    `;
    
    sidebar.innerHTML = navHtml;
}

// Setup user info
function setupUserInfo() {
    if (currentUser) {
        topUserInfo.innerHTML = `
            <div class="user-welcome">
                Welcome, <strong>${currentUser.username}</strong>
                <div class="user-role">(${currentUser.role})</div>
            </div>
            <button id="logout-btn">Logout</button>
        `;
        
        document.getElementById('logout-btn').addEventListener('click', logoutUser);
    }
}

// Highlight active navigation item
function highlightActiveNavItem(target) {
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to current nav link
    const activeLink = document.querySelector(`.sidebar-nav-link[data-target="${target}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Load dashboard content
async function loadDashboardContent() {
    try {
        // Show loading state
        document.getElementById('dashboard-content').innerHTML = `
            <div class="empty-state">
                <div class="loading"></div>
                <p>Loading dashboard...</p>
            </div>
        `;
        
        // Fetch data for dashboard stats
        const [transactionsRes, billsRes, advancesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/transactions`, { credentials: 'include' }),
            fetch(`${API_BASE_URL}/bills`, { credentials: 'include' }),
            fetch(`${API_BASE_URL}/advances`, { credentials: 'include' })
        ]);
        
        const transactionsData = await transactionsRes.json();
        const billsData = await billsRes.json();
        const advancesData = await advancesRes.json();
        
        const transactions = transactionsData.transactions || [];
        const bills = billsData.bills || [];
        const advances = advancesData.advances || [];
        
        // Calculate stats
        const totalTransactions = transactions.length;
        const totalBills = bills.length;
        const pendingBills = bills.filter(bill => bill.status === 'Pending').length;
        const totalAdvances = advances.length;
        
        // Render dashboard content
        document.getElementById('dashboard-content').innerHTML = `
            <div class="stats-container">
                <div class="stat-card primary">
                    <div class="stat-value">${totalTransactions}</div>
                    <div class="stat-label">Total Transactions</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-value">${totalBills}</div>
                    <div class="stat-label">Total Bills</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-value">${pendingBills}</div>
                    <div class="stat-label">Pending Bills</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-value">${totalAdvances}</div>
                    <div class="stat-label">Total Advances</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>Recent Activity</h3>
                </div>
                <div id="recent-activity">
                    ${renderRecentActivity(transactions, bills, advances)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('dashboard-content').innerHTML = `
            <div class="empty-state">
                <p>Error loading dashboard data</p>
            </div>
        `;
    }
}

// Render recent activity
function renderRecentActivity(transactions, bills, advances) {
    // Combine all activities with timestamps
    const activities = [
        ...transactions.map(t => ({
            type: 'Transaction',
            description: `Transaction ${t.transaction_id} - $${parseFloat(t.amount).toFixed(2)}`,
            date: t.updated_at || t.created_at,
            user: t.entered_by_name
        })),
        ...bills.map(b => ({
            type: 'Bill',
            description: `Bill ${b.bill_number} - $${parseFloat(b.amount).toFixed(2)} (${b.status})`,
            date: b.updated_at || b.created_at,
            user: b.entered_by_name
        })),
        ...advances.map(a => ({
            type: 'Advance',
            description: `Advance for ${a.employee_name} - $${parseFloat(a.advance_amount).toFixed(2)}`,
            date: a.updated_at || a.created_at,
            user: a.entered_by_name
        }))
    ];
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take only the 5 most recent
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        return `
            <div class="empty-state">
                <p>No recent activity</p>
            </div>
        `;
    }
    
    let html = `
        <table class="activity-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>User</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    recentActivities.forEach(activity => {
        html += `
            <tr>
                <td>${activity.type}</td>
                <td>${activity.description}</td>
                <td>${activity.user}</td>
                <td>${new Date(activity.date).toLocaleDateString()}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Load transactions content
function loadTransactionsContent() {
    const content = `
        <div class="table-container">
            <div class="table-header">
                <div>
                    <h3>Transactions</h3>
                </div>
                <div class="table-actions">
                    <input type="text" class="search-input" placeholder="Search transactions..." id="transaction-search">
                    <button class="btn btn-primary" onclick="showAddTransactionForm()">Add New Transaction</button>
                </div>
            </div>
            <div class="table-responsive">
                <div id="transactions-list">
                    <div class="empty-state">
                        <div class="loading"></div>
                        <p>Loading transactions...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('transactions-content').innerHTML = content;
    loadTransactionsList();
    
    // Add search functionality
    const searchInput = document.getElementById('transaction-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterTransactions(searchInput.value);
        }, 300));
    }
}

// Load bills content
function loadBillsContent() {
    const content = `
        <div class="table-container">
            <div class="table-header">
                <div>
                    <h3>Bills</h3>
                </div>
                <div class="table-actions">
                    <input type="text" class="search-input" placeholder="Search bills..." id="bill-search">
                    <button class="btn btn-primary" onclick="showAddBillForm()">Add New Bill</button>
                </div>
            </div>
            <div class="table-responsive">
                <div id="bills-list">
                    <div class="empty-state">
                        <div class="loading"></div>
                        <p>Loading bills...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('bills-content').innerHTML = content;
    loadBillsList();
    
    // Add search functionality
    const searchInput = document.getElementById('bill-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterBills(searchInput.value);
        }, 300));
    }
}

// Load advances content
function loadAdvancesContent() {
    const content = `
        <div class="table-container">
            <div class="table-header">
                <div>
                    <h3>Advances</h3>
                </div>
                <div class="table-actions">
                    <input type="text" class="search-input" placeholder="Search advances..." id="advance-search">
                    <button class="btn btn-primary" onclick="showAddAdvanceForm()">Add New Advance</button>
                </div>
            </div>
            <div class="table-responsive">
                <div id="advances-list">
                    <div class="empty-state">
                        <div class="loading"></div>
                        <p>Loading advances...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('advances-content').innerHTML = content;
    loadAdvancesList();
    
    // Add search functionality
    const searchInput = document.getElementById('advance-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterAdvances(searchInput.value);
        }, 300));
    }
}

// Load transactions list
async function loadTransactionsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayTransactionsList(data.transactions);
        } else {
            document.getElementById('transactions-list').innerHTML = `
                <div class="empty-state">
                    <p>Error loading transactions</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-list').innerHTML = `
            <div class="empty-state">
                <p>Error loading transactions</p>
            </div>
        `;
    }
}

// Display transactions list
function displayTransactionsList(transactions) {
    if (transactions.length === 0) {
        document.getElementById('transactions-list').innerHTML = `
            <div class="empty-state">
                <p>No transactions found</p>
                <button class="btn btn-primary mt-2" onclick="showAddTransactionForm()">Add New Transaction</button>
            </div>
        `;
        return;
    }
    
    let tableHtml = `
        <table id="transactions-table">
            <thead>
                <tr>
                    <th class="sortable" data-sort="transaction_id">ID ↕</th>
                    <th class="sortable" data-sort="date">Date ↕</th>
                    <th class="sortable" data-sort="description">Description ↕</th>
                    <th class="sortable" data-sort="amount">Amount ↕</th>
                    <th class="sortable" data-sort="entered_by_name">Entered By ↕</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    transactions.forEach(transaction => {
        tableHtml += `
            <tr data-id="${transaction.id}">
                <td>${transaction.transaction_id}</td>
                <td>${transaction.date}</td>
                <td>${transaction.description || '-'}</td>
                <td>$${parseFloat(transaction.amount).toFixed(2)}</td>
                <td>${transaction.entered_by_name}</td>
                <td>
                    <button class="btn btn-outline btn-sm mr-1" onclick="viewTransaction(${transaction.id})">View</button>
                    ${currentUser.role === 'admin' ? `
                        <button class="btn btn-secondary btn-sm mr-1" onclick="editTransaction(${transaction.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDelete('transaction', ${transaction.id})">Delete</button>
                    ` : `
                        <button class="btn btn-outline btn-sm" disabled>Delete</button>
                    `}
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    document.getElementById('transactions-list').innerHTML = tableHtml;
    
    // Add sorting functionality
    addSortingToTable('transactions-table', transactions);
}

// Load bills list
async function loadBillsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/bills`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayBillsList(data.bills);
        } else {
            document.getElementById('bills-list').innerHTML = `
                <div class="empty-state">
                    <p>Error loading bills</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bills:', error);
        document.getElementById('bills-list').innerHTML = `
            <div class="empty-state">
                <p>Error loading bills</p>
            </div>
        `;
    }
}

// Display bills list
function displayBillsList(bills) {
    if (bills.length === 0) {
        document.getElementById('bills-list').innerHTML = `
            <div class="empty-state">
                <p>No bills found</p>
                <button class="btn btn-primary mt-2" onclick="showAddBillForm()">Add New Bill</button>
            </div>
        `;
        return;
    }
    
    let tableHtml = `
        <table id="bills-table">
            <thead>
                <tr>
                    <th class="sortable" data-sort="bill_number">Bill Number ↕</th>
                    <th class="sortable" data-sort="vendor_name">Vendor ↕</th>
                    <th class="sortable" data-sort="date">Date ↕</th>
                    <th class="sortable" data-sort="amount">Amount ↕</th>
                    <th class="sortable" data-sort="status">Status ↕</th>
                    <th class="sortable" data-sort="entered_by_name">Entered By ↕</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    bills.forEach(bill => {
        const statusClass = bill.status === 'Paid' ? 'badge-success' : 'badge-warning';
        
        tableHtml += `
            <tr data-id="${bill.id}">
                <td>${bill.bill_number}</td>
                <td>${bill.vendor_name}</td>
                <td>${bill.date}</td>
                <td>$${parseFloat(bill.amount).toFixed(2)}</td>
                <td><span class="badge ${statusClass}">${bill.status}</span></td>
                <td>${bill.entered_by_name}</td>
                <td>
                    <button class="btn btn-outline btn-sm mr-1" onclick="viewBill(${bill.id})">View</button>
                    ${currentUser.role === 'admin' ? `
                        <button class="btn btn-secondary btn-sm mr-1" onclick="editBill(${bill.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDelete('bill', ${bill.id})">Delete</button>
                    ` : `
                        <button class="btn btn-outline btn-sm" disabled>Delete</button>
                    `}
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    document.getElementById('bills-list').innerHTML = tableHtml;
    
    // Add sorting functionality
    addSortingToTable('bills-table', bills);
}

// Load advances list
async function loadAdvancesList() {
    try {
        const response = await fetch(`${API_BASE_URL}/advances`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayAdvancesList(data.advances);
        } else {
            document.getElementById('advances-list').innerHTML = `
                <div class="empty-state">
                    <p>Error loading advances</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading advances:', error);
        document.getElementById('advances-list').innerHTML = `
            <div class="empty-state">
                <p>Error loading advances</p>
            </div>
        `;
    }
}

// Display advances list
function displayAdvancesList(advances) {
    if (advances.length === 0) {
        document.getElementById('advances-list').innerHTML = `
            <div class="empty-state">
                <p>No advances found</p>
                <button class="btn btn-primary mt-2" onclick="showAddAdvanceForm()">Add New Advance</button>
            </div>
        `;
        return;
    }
    
    let tableHtml = `
        <table id="advances-table">
            <thead>
                <tr>
                    <th class="sortable" data-sort="employee_name">Employee ↕</th>
                    <th class="sortable" data-sort="advance_amount">Advance Amount ↕</th>
                    <th class="sortable" data-sort="date">Date ↕</th>
                    <th class="sortable" data-sort="remaining_due">Remaining Due ↕</th>
                    <th class="sortable" data-sort="entered_by_name">Entered By ↕</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    advances.forEach(advance => {
        tableHtml += `
            <tr data-id="${advance.id}">
                <td>${advance.employee_name}</td>
                <td>$${parseFloat(advance.advance_amount).toFixed(2)}</td>
                <td>${advance.date}</td>
                <td>$${parseFloat(advance.remaining_due).toFixed(2)}</td>
                <td>${advance.entered_by_name}</td>
                <td>
                    <button class="btn btn-outline btn-sm mr-1" onclick="viewAdvance(${advance.id})">View</button>
                    ${currentUser.role === 'admin' ? `
                        <button class="btn btn-secondary btn-sm mr-1" onclick="editAdvance(${advance.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDelete('advance', ${advance.id})">Delete</button>
                    ` : `
                        <button class="btn btn-outline btn-sm" disabled>Delete</button>
                    `}
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    document.getElementById('advances-list').innerHTML = tableHtml;
    
    // Add sorting functionality
    addSortingToTable('advances-table', advances);
}

// Add sorting to table
function addSortingToTable(tableId, data) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const headers = table.querySelectorAll('th.sortable');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.getAttribute('data-sort');
            const isAscending = !header.classList.contains('sort-asc');
            
            // Update header classes
            headers.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            header.classList.toggle('sort-asc', isAscending);
            header.classList.toggle('sort-desc', !isAscending);
            
            // Sort data
            const sortedData = [...data].sort((a, b) => {
                let aVal = a[sortBy];
                let bVal = b[sortBy];
                
                // Handle numeric values
                if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }
                
                // Handle dates
                if (Date.parse(aVal) && Date.parse(bVal)) {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                
                if (aVal < bVal) return isAscending ? -1 : 1;
                if (aVal > bVal) return isAscending ? 1 : -1;
                return 0;
            });
            
            // Re-render table based on current section
            if (tableId === 'transactions-table') {
                displayTransactionsList(sortedData);
            } else if (tableId === 'bills-table') {
                displayBillsList(sortedData);
            } else if (tableId === 'advances-table') {
                displayAdvancesList(sortedData);
            }
        });
    });
}

// Filter transactions
function filterTransactions(searchTerm) {
    const rows = document.querySelectorAll('#transactions-table tbody tr');
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Filter bills
function filterBills(searchTerm) {
    const rows = document.querySelectorAll('#bills-table tbody tr');
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Filter advances
function filterAdvances(searchTerm) {
    const rows = document.querySelectorAll('#advances-table tbody tr');
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Show add transaction form
function showAddTransactionForm() {
    const formHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Add New Transaction</h3>
            </div>
            <form id="add-transaction-form">
                <div class="form-group">
                    <label for="transaction_id">Transaction ID <span class="required">*</span></label>
                    <input type="text" id="transaction_id" name="transaction_id" required>
                    <div class="invalid-feedback">Transaction ID is required</div>
                </div>
                <div class="form-group">
                    <label for="date">Date <span class="required">*</span></label>
                    <input type="date" id="date" name="date" required>
                    <div class="invalid-feedback">Date is required</div>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="amount">Amount <span class="required">*</span></label>
                    <input type="number" id="amount" name="amount" step="0.01" min="0" required>
                    <div class="invalid-feedback">Valid amount is required</div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="loadTransactionsContent()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submit-transaction">Add Transaction</button>
                </div>
            </form>
            <div id="transaction-message"></div>
        </div>
    `;
    
    document.getElementById('transactions-content').innerHTML = formHtml;
    
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transactionData = Object.fromEntries(formData.entries());
        await addTransaction(transactionData);
    });
}

// Show edit transaction form
function showEditTransactionForm(transaction) {
    const formHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Edit Transaction</h3>
            </div>
            <form id="edit-transaction-form">
                <input type="hidden" id="id" name="id" value="${transaction.id}">
                <div class="form-group">
                    <label for="transaction_id">Transaction ID <span class="required">*</span></label>
                    <input type="text" id="transaction_id" name="transaction_id" value="${transaction.transaction_id}" required>
                    <div class="invalid-feedback">Transaction ID is required</div>
                </div>
                <div class="form-group">
                    <label for="date">Date <span class="required">*</span></label>
                    <input type="date" id="date" name="date" value="${transaction.date}" required>
                    <div class="invalid-feedback">Date is required</div>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="3">${transaction.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="amount">Amount <span class="required">*</span></label>
                    <input type="number" id="amount" name="amount" step="0.01" min="0" value="${transaction.amount}" required>
                    <div class="invalid-feedback">Valid amount is required</div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="loadTransactionsContent()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submit-transaction">Update Transaction</button>
                </div>
            </form>
            <div id="transaction-message"></div>
        </div>
    `;
    
    document.getElementById('transactions-content').innerHTML = formHtml;
    
    document.getElementById('edit-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transactionData = Object.fromEntries(formData.entries());
        await updateTransaction(transactionData);
    });
}

// Show view transaction card
function showViewTransactionCard(transaction) {
    const cardHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Transaction Details</h3>
            </div>
            <div class="card-body">
                <div class="detail-row">
                    <span class="detail-label">Transaction ID:</span>
                    <span class="detail-value">${transaction.transaction_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${transaction.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Description:</span>
                    <span class="detail-value">${transaction.description || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">$${parseFloat(transaction.amount).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Entered By:</span>
                    <span class="detail-value">${transaction.entered_by_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created At:</span>
                    <span class="detail-value">${new Date(transaction.created_at).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Updated:</span>
                    <span class="detail-value">${new Date(transaction.updated_at).toLocaleString()}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-secondary" onclick="loadTransactionsContent()">Back to List</button>
                ${currentUser.role === 'admin' ? `
                    <button class="btn btn-primary" onclick="editTransaction(${transaction.id})">Edit</button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('transactions-content').innerHTML = cardHtml;
}

// Add transaction
async function addTransaction(transactionData) {
    const submitBtn = document.getElementById('submit-transaction');
    const messageDiv = document.getElementById('transaction-message');
    
    try {
        // Validate form
        const isValid = validateTransactionForm(transactionData);
        if (!isValid) return;
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Adding...';
        
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(transactionData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Transaction added successfully!', 'success');
            setTimeout(() => {
                loadTransactionsContent();
            }, 1500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to add transaction', 'error');
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        showMessage(messageDiv, 'An error occurred while adding the transaction', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add Transaction';
    }
}

// Update transaction
async function updateTransaction(transactionData) {
    const submitBtn = document.getElementById('submit-transaction');
    const messageDiv = document.getElementById('transaction-message');
    const id = transactionData.id;
    
    try {
        // Validate form
        const isValid = validateTransactionForm(transactionData);
        if (!isValid) return;
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Updating...';
        
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                transaction_id: transactionData.transaction_id,
                date: transactionData.date,
                description: transactionData.description,
                amount: transactionData.amount
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Transaction updated successfully!', 'success');
            setTimeout(() => {
                loadTransactionsContent();
            }, 1500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to update transaction', 'error');
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        showMessage(messageDiv, 'An error occurred while updating the transaction', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Transaction';
    }
}

// Validate transaction form
function validateTransactionForm(data) {
    let isValid = true;
    
    // Reset validation states
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('invalid');
    });
    
    // Validate required fields
    if (!data.transaction_id || data.transaction_id.trim() === '') {
        document.querySelector('[name="transaction_id"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.date || data.date.trim() === '') {
        document.querySelector('[name="date"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
        document.querySelector('[name="amount"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    return isValid;
}

// Show add bill form
function showAddBillForm() {
    const formHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Add New Bill</h3>
            </div>
            <form id="add-bill-form">
                <div class="form-group">
                    <label for="bill_number">Bill Number <span class="required">*</span></label>
                    <input type="text" id="bill_number" name="bill_number" required>
                    <div class="invalid-feedback">Bill number is required</div>
                </div>
                <div class="form-group">
                    <label for="vendor_name">Vendor Name <span class="required">*</span></label>
                    <input type="text" id="vendor_name" name="vendor_name" required>
                    <div class="invalid-feedback">Vendor name is required</div>
                </div>
                <div class="form-group">
                    <label for="date">Date <span class="required">*</span></label>
                    <input type="date" id="date" name="date" required>
                    <div class="invalid-feedback">Date is required</div>
                </div>
                <div class="form-group">
                    <label for="amount">Amount <span class="required">*</span></label>
                    <input type="number" id="amount" name="amount" step="0.01" min="0" required>
                    <div class="invalid-feedback">Valid amount is required</div>
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="loadBillsContent()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submit-bill">Add Bill</button>
                </div>
            </form>
            <div id="bill-message"></div>
        </div>
    `;
    
    document.getElementById('bills-content').innerHTML = formHtml;
    
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    document.getElementById('add-bill-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const billData = Object.fromEntries(formData.entries());
        await addBill(billData);
    });
}

// Show edit bill form
function showEditBillForm(bill) {
    const formHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Edit Bill</h3>
            </div>
            <form id="edit-bill-form">
                <input type="hidden" id="id" name="id" value="${bill.id}">
                <div class="form-group">
                    <label for="bill_number">Bill Number <span class="required">*</span></label>
                    <input type="text" id="bill_number" name="bill_number" value="${bill.bill_number}" required>
                    <div class="invalid-feedback">Bill number is required</div>
                </div>
                <div class="form-group">
                    <label for="vendor_name">Vendor Name <span class="required">*</span></label>
                    <input type="text" id="vendor_name" name="vendor_name" value="${bill.vendor_name}" required>
                    <div class="invalid-feedback">Vendor name is required</div>
                </div>
                <div class="form-group">
                    <label for="date">Date <span class="required">*</span></label>
                    <input type="date" id="date" name="date" value="${bill.date}" required>
                    <div class="invalid-feedback">Date is required</div>
                </div>
                <div class="form-group">
                    <label for="amount">Amount <span class="required">*</span></label>
                    <input type="number" id="amount" name="amount" step="0.01" min="0" value="${bill.amount}" required>
                    <div class="invalid-feedback">Valid amount is required</div>
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="Pending" ${bill.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Paid" ${bill.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="loadBillsContent()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submit-bill">Update Bill</button>
                </div>
            </form>
            <div id="bill-message"></div>
        </div>
    `;
    
    document.getElementById('bills-content').innerHTML = formHtml;
    
    document.getElementById('edit-bill-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const billData = Object.fromEntries(formData.entries());
        await updateBill(billData);
    });
}

// Show view bill card
function showViewBillCard(bill) {
    const cardHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Bill Details</h3>
            </div>
            <div class="card-body">
                <div class="detail-row">
                    <span class="detail-label">Bill Number:</span>
                    <span class="detail-value">${bill.bill_number}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vendor Name:</span>
                    <span class="detail-value">${bill.vendor_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${bill.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">$${parseFloat(bill.amount).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value"><span class="badge ${bill.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${bill.status}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Entered By:</span>
                    <span class="detail-value">${bill.entered_by_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created At:</span>
                    <span class="detail-value">${new Date(bill.created_at).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Updated:</span>
                    <span class="detail-value">${new Date(bill.updated_at).toLocaleString()}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-secondary" onclick="loadBillsContent()">Back to List</button>
                ${currentUser.role === 'admin' ? `
                    <button class="btn btn-primary" onclick="editBill(${bill.id})">Edit</button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('bills-content').innerHTML = cardHtml;
}

// Add bill
async function addBill(billData) {
    const submitBtn = document.getElementById('submit-bill');
    const messageDiv = document.getElementById('bill-message');
    
    try {
        // Validate form
        const isValid = validateBillForm(billData);
        if (!isValid) return;
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Adding...';
        
        const response = await fetch(`${API_BASE_URL}/bills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(billData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Bill added successfully!', 'success');
            setTimeout(() => {
                loadBillsContent();
            }, 1500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to add bill', 'error');
        }
    } catch (error) {
        console.error('Error adding bill:', error);
        showMessage(messageDiv, 'An error occurred while adding the bill', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add Bill';
    }
}

// Update bill
async function updateBill(billData) {
    const submitBtn = document.getElementById('submit-bill');
    const messageDiv = document.getElementById('bill-message');
    const id = billData.id;
    
    try {
        // Validate form
        const isValid = validateBillForm(billData);
        if (!isValid) return;
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Updating...';
        
        const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                bill_number: billData.bill_number,
                vendor_name: billData.vendor_name,
                date: billData.date,
                amount: billData.amount,
                status: billData.status
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Bill updated successfully!', 'success');
            setTimeout(() => {
                loadBillsContent();
            }, 1500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to update bill', 'error');
        }
    } catch (error) {
        console.error('Error updating bill:', error);
        showMessage(messageDiv, 'An error occurred while updating the bill', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Bill';
    }
}

// Validate bill form
function validateBillForm(data) {
    let isValid = true;
    
    // Reset validation states
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('invalid');
    });
    
    // Validate required fields
    if (!data.bill_number || data.bill_number.trim() === '') {
        document.querySelector('[name="bill_number"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.vendor_name || data.vendor_name.trim() === '') {
        document.querySelector('[name="vendor_name"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.date || data.date.trim() === '') {
        document.querySelector('[name="date"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
        document.querySelector('[name="amount"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    return isValid;
}

// Show add advance form
function showAddAdvanceForm() {
    const formHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Add New Advance</h3>
            </div>
            <form id="add-advance-form">
                <div class="form-group">
                    <label for="employee_id">Employee ID <span class="required">*</span></label>
                    <input type="number" id="employee_id" name="employee_id" required ${currentUser.role !== 'admin' ? `value="${currentUser.id}" readonly` : ''}>
                    <div class="invalid-feedback">Employee ID is required</div>
                </div>
                <div class="form-group">
                    <label for="advance_amount">Advance Amount <span class="required">*</span></label>
                    <input type="number" id="advance_amount" name="advance_amount" step="0.01" min="0" required>
                    <div class="invalid-feedback">Valid advance amount is required</div>
                </div>
                <div class="form-group">
                    <label for="date">Date <span class="required">*</span></label>
                    <input type="date" id="date" name="date" required>
                    <div class="invalid-feedback">Date is required</div>
                </div>
                <div class="form-group">
                    <label for="remaining_due">Remaining Due <span class="required">*</span></label>
                    <input type="number" id="remaining_due" name="remaining_due" step="0.01" min="0" required>
                    <div class="invalid-feedback">Valid remaining due amount is required</div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="loadAdvancesContent()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submit-advance">Add Advance</button>
                </div>
            </form>
            <div id="advance-message"></div>
        </div>
    `;
    
    document.getElementById('advances-content').innerHTML = formHtml;
    
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    document.getElementById('add-advance-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const advanceData = Object.fromEntries(formData.entries());
        await addAdvance(advanceData);
    });
}

// Show edit advance form
function showEditAdvanceForm(advance) {
    const formHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Edit Advance</h3>
            </div>
            <form id="edit-advance-form">
                <input type="hidden" id="id" name="id" value="${advance.id}">
                <div class="form-group">
                    <label for="employee_id">Employee ID <span class="required">*</span></label>
                    <input type="number" id="employee_id" name="employee_id" value="${advance.employee_id}" required ${currentUser.role !== 'admin' ? `readonly` : ''}>
                    <div class="invalid-feedback">Employee ID is required</div>
                </div>
                <div class="form-group">
                    <label for="advance_amount">Advance Amount <span class="required">*</span></label>
                    <input type="number" id="advance_amount" name="advance_amount" step="0.01" min="0" value="${advance.advance_amount}" required>
                    <div class="invalid-feedback">Valid advance amount is required</div>
                </div>
                <div class="form-group">
                    <label for="date">Date <span class="required">*</span></label>
                    <input type="date" id="date" name="date" value="${advance.date}" required>
                    <div class="invalid-feedback">Date is required</div>
                </div>
                <div class="form-group">
                    <label for="remaining_due">Remaining Due <span class="required">*</span></label>
                    <input type="number" id="remaining_due" name="remaining_due" step="0.01" min="0" value="${advance.remaining_due}" required>
                    <div class="invalid-feedback">Valid remaining due amount is required</div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="loadAdvancesContent()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submit-advance">Update Advance</button>
                </div>
            </form>
            <div id="advance-message"></div>
        </div>
    `;
    
    document.getElementById('advances-content').innerHTML = formHtml;
    
    document.getElementById('edit-advance-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const advanceData = Object.fromEntries(formData.entries());
        await updateAdvance(advanceData);
    });
}

// Show view advance card
function showViewAdvanceCard(advance) {
    const cardHtml = `
        <div class="card">
            <div class="card-header">
                <h3>Advance Details</h3>
            </div>
            <div class="card-body">
                <div class="detail-row">
                    <span class="detail-label">Employee:</span>
                    <span class="detail-value">${advance.employee_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Advance Amount:</span>
                    <span class="detail-value">$${parseFloat(advance.advance_amount).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${advance.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Remaining Due:</span>
                    <span class="detail-value">$${parseFloat(advance.remaining_due).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Entered By:</span>
                    <span class="detail-value">${advance.entered_by_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created At:</span>
                    <span class="detail-value">${new Date(advance.created_at).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Updated:</span>
                    <span class="detail-value">${new Date(advance.updated_at).toLocaleString()}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-secondary" onclick="loadAdvancesContent()">Back to List</button>
                ${currentUser.role === 'admin' ? `
                    <button class="btn btn-primary" onclick="editAdvance(${advance.id})">Edit</button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('advances-content').innerHTML = cardHtml;
}

// Add advance
async function addAdvance(advanceData) {
    const submitBtn = document.getElementById('submit-advance');
    const messageDiv = document.getElementById('advance-message');
    
    try {
        // Validate form
        const isValid = validateAdvanceForm(advanceData);
        if (!isValid) return;
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Adding...';
        
        const response = await fetch(`${API_BASE_URL}/advances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(advanceData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Advance added successfully!', 'success');
            setTimeout(() => {
                loadAdvancesContent();
            }, 1500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to add advance', 'error');
        }
    } catch (error) {
        console.error('Error adding advance:', error);
        showMessage(messageDiv, 'An error occurred while adding the advance', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add Advance';
    }
}

// Update advance
async function updateAdvance(advanceData) {
    const submitBtn = document.getElementById('submit-advance');
    const messageDiv = document.getElementById('advance-message');
    const id = advanceData.id;
    
    try {
        // Validate form
        const isValid = validateAdvanceForm(advanceData);
        if (!isValid) return;
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Updating...';
        
        const response = await fetch(`${API_BASE_URL}/advances/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                employee_id: advanceData.employee_id,
                advance_amount: advanceData.advance_amount,
                date: advanceData.date,
                remaining_due: advanceData.remaining_due
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Advance updated successfully!', 'success');
            setTimeout(() => {
                loadAdvancesContent();
            }, 1500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to update advance', 'error');
        }
    } catch (error) {
        console.error('Error updating advance:', error);
        showMessage(messageDiv, 'An error occurred while updating the advance', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Advance';
    }
}

// Validate advance form
function validateAdvanceForm(data) {
    let isValid = true;
    
    // Reset validation states
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('invalid');
    });
    
    // Validate required fields
    if (!data.employee_id || data.employee_id.trim() === '') {
        document.querySelector('[name="employee_id"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.advance_amount || isNaN(parseFloat(data.advance_amount)) || parseFloat(data.advance_amount) <= 0) {
        document.querySelector('[name="advance_amount"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.date || data.date.trim() === '') {
        document.querySelector('[name="date"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    if (!data.remaining_due || isNaN(parseFloat(data.remaining_due)) || parseFloat(data.remaining_due) < 0) {
        document.querySelector('[name="remaining_due"]').closest('.form-group').classList.add('invalid');
        isValid = false;
    }
    
    return isValid;
}

// Show message
function showMessage(element, message, type) {
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.innerHTML = '';
        }, 3000);
    }
}

// Clear message
function clearMessage(element) {
    element.innerHTML = '';
}

// Show toast notification
function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container');
    
    // Clear any existing toast timeout
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        // Also remove any existing toast
        const existingToast = toastContainer.querySelector('.toast');
        if (existingToast) {
            existingToast.style.opacity = '0';
            setTimeout(() => {
                if (existingToast.parentNode === toastContainer) {
                    toastContainer.removeChild(existingToast);
                }
            }, 300);
        }
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-out';
    
    toastContainer.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Remove toast after 3 seconds with fade out
    toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode === toastContainer) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Show confirmation modal
function confirmDelete(type, id) {
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    
    modalMessage.textContent = `Are you sure you want to delete this ${type}? This action cannot be undone.`;
    modal.classList.remove('hidden');
    
    // Set the confirm action
    window.confirmAction = () => {
        if (type === 'transaction') {
            deleteTransaction(id);
        } else if (type === 'bill') {
            deleteBill(id);
        } else if (type === 'advance') {
            deleteAdvance(id);
        }
    };
}

// Hide modal
function hideModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.add('hidden');
    window.confirmAction = null;
}

// Delete transaction
async function deleteTransaction(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('Transaction deleted successfully!', 'success');
            // Reload the current section
            if (currentSection === 'transactions') {
                loadTransactionsList();
            }
        } else {
            showToast('Failed to delete transaction', 'error');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showToast('Error deleting transaction', 'error');
    }
}

// Delete bill
async function deleteBill(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('Bill deleted successfully!', 'success');
            // Reload the current section
            if (currentSection === 'bills') {
                loadBillsList();
            }
        } else {
            showToast('Failed to delete bill', 'error');
        }
    } catch (error) {
        console.error('Error deleting bill:', error);
        showToast('Error deleting bill', 'error');
    }
}

// Delete advance
async function deleteAdvance(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/advances/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('Advance deleted successfully!', 'success');
            // Reload the current section
            if (currentSection === 'advances') {
                loadAdvancesList();
            }
        } else {
            showToast('Failed to delete advance', 'error');
        }
    } catch (error) {
        console.error('Error deleting advance:', error);
        showToast('Error deleting advance', 'error');
    }
}

// View transaction
async function viewTransaction(id) {
    try {
        // Fetch the transaction details
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showToast('Failed to fetch transaction details', 'error');
            return;
        }
        
        const data = await response.json();
        const transaction = data.transaction;
        
        // Show view card
        showViewTransactionCard(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        showToast('Error fetching transaction details', 'error');
    }
}

// Edit transaction
async function editTransaction(id) {
    try {
        // Fetch the transaction details
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showToast('Failed to fetch transaction details', 'error');
            return;
        }
        
        const data = await response.json();
        const transaction = data.transaction;
        
        // Show edit form
        showEditTransactionForm(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        showToast('Error fetching transaction details', 'error');
    }
}

// View bill
async function viewBill(id) {
    try {
        // Fetch the bill details
        const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showToast('Failed to fetch bill details', 'error');
            return;
        }
        
        const data = await response.json();
        const bill = data.bill;
        
        // Show view card
        showViewBillCard(bill);
    } catch (error) {
        console.error('Error fetching bill:', error);
        showToast('Error fetching bill details', 'error');
    }
}

// Edit bill
async function editBill(id) {
    try {
        // Fetch the bill details
        const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showToast('Failed to fetch bill details', 'error');
            return;
        }
        
        const data = await response.json();
        const bill = data.bill;
        
        // Show edit form
        showEditBillForm(bill);
    } catch (error) {
        console.error('Error fetching bill:', error);
        showToast('Error fetching bill details', 'error');
    }
}

// View advance
async function viewAdvance(id) {
    try {
        // Fetch the advance details
        const response = await fetch(`${API_BASE_URL}/advances/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showToast('Failed to fetch advance details', 'error');
            return;
        }
        
        const data = await response.json();
        const advance = data.advance;
        
        // Show view card
        showViewAdvanceCard(advance);
    } catch (error) {
        console.error('Error fetching advance:', error);
        showToast('Error fetching advance details', 'error');
    }
}

// Edit advance
async function editAdvance(id) {
    try {
        // Fetch the advance details
        const response = await fetch(`${API_BASE_URL}/advances/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showToast('Failed to fetch advance details', 'error');
            return;
        }
        
        const data = await response.json();
        const advance = data.advance;
        
        // Show edit form
        showEditAdvanceForm(advance);
    } catch (error) {
        console.error('Error fetching advance:', error);
        showToast('Error fetching advance details', 'error');
    }
}

// Debounce function for search
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}