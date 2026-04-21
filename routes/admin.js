const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { isAuthenticated } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Database configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'harsh',
    database: process.env.DB_NAME || 'handicare',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    if (req.session.userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
};

// Get dashboard statistics
router.get('/api/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const period = req.query.period || 'month';
        let timeFilter = '';
        
        switch(period) {
            case 'today':
                timeFilter = 'DATE(created_at) = CURDATE()';
                break;
            case 'week':
                timeFilter = 'YEARWEEK(created_at) = YEARWEEK(CURDATE())';
                break;
            case 'month':
                timeFilter = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
                break;
            case 'year':
                timeFilter = 'YEAR(created_at) = YEAR(CURDATE())';
                break;
        }

        const [userCount] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE ${timeFilter}`);
        const [volunteerCount] = await pool.query(`SELECT COUNT(*) as count FROM volunteers WHERE ${timeFilter}`);
        const [requestCount] = await pool.query(`SELECT COUNT(*) as count FROM help_requests WHERE ${timeFilter}`);
        const [completedCount] = await pool.query(`SELECT COUNT(*) as count FROM help_requests WHERE status = 'completed' AND ${timeFilter}`);

        res.json({
            success: true,
            stats: {
                userCount: userCount[0].count,
                volunteerCount: volunteerCount[0].count,
                requestCount: requestCount[0].count,
                completedCount: completedCount[0].count
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get all volunteers
router.get('/api/admin/volunteers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [volunteers] = await pool.query('SELECT * FROM volunteers ORDER BY created_at DESC');
        res.json({ success: true, volunteers });
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get all help requests
router.get('/api/admin/requests', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [requests] = await pool.query(`
            SELECT r.*, u.name as user_name, v.name as volunteer_name 
            FROM help_requests r 
            LEFT JOIN users u ON r.user_id = u.id 
            LEFT JOIN volunteers v ON r.volunteer_id = v.id 
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching help requests:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get all feedback
router.get('/api/admin/feedback', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [feedback] = await pool.query(`
            SELECT f.*, u.name as user_name, v.name as volunteer_name 
            FROM feedback f 
            LEFT JOIN users u ON f.user_id = u.id 
            LEFT JOIN volunteers v ON f.volunteer_id = v.id 
            ORDER BY f.created_at DESC
        `);
        res.json({ success: true, feedback });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get transaction history
router.get('/api/admin/transactions', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [transactions] = await pool.query(`
            SELECT t.*, u.name as user_name, v.name as volunteer_name 
            FROM transactions t 
            LEFT JOIN users u ON t.user_id = u.id 
            LEFT JOIN volunteers v ON t.volunteer_id = v.id 
            ORDER BY t.created_at DESC
        `);
        // Ensure amount is a number
        const formattedTransactions = transactions.map(t => ({
            ...t,
            amount: Number(t.amount)
        }));
        res.json({ success: true, transactions: formattedTransactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get reports data
router.get('/api/admin/reports', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [userGrowth] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count 
            FROM users 
            GROUP BY month 
            ORDER BY month DESC 
            LIMIT 12
        `);
        
        const [requestStats] = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM help_requests 
            GROUP BY status
        `);
        
        const [volunteerActivity] = await pool.query(`
            SELECT v.name, COUNT(r.id) as completed_requests 
            FROM volunteers v 
            LEFT JOIN help_requests r ON v.id = r.volunteer_id AND r.status = 'completed' 
            GROUP BY v.id 
            ORDER BY completed_requests DESC 
            LIMIT 10
        `);

        res.json({
            success: true,
            reports: {
                userGrowth,
                requestStats,
                volunteerActivity
            }
        });
    } catch (error) {
        console.error('Error generating reports:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get system settings
router.get('/api/admin/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Add your settings logic here
        res.json({
            success: true,
            settings: {
                systemEmail: 'admin@handicare.org',
                notificationsEnabled: true,
                maintenanceMode: false,
                // Add more settings as needed
            }
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Admin registration endpoint
router.post('/api/admin/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    try {
        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.json({ success: true, message: 'Admin registered successfully' });
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get a single user's details
router.get('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, item: rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update a user's details
router.put('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { name, email, phone, address, disability } = req.body;
    try {
        await pool.query(
            'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, disability = ? WHERE id = ?',
            [name, email, phone, address, disability, req.params.id]
        );
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete a user
router.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get a single volunteer's details
router.get('/api/admin/volunteers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM volunteers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Volunteer not found' });
        }
        res.json({ success: true, item: rows[0] });
    } catch (error) {
        console.error('Error fetching volunteer:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update a volunteer's details
router.put('/api/admin/volunteers/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { name, email, phone, address, skills, availability, status } = req.body;
    try {
        await pool.query(
            'UPDATE volunteers SET name = ?, email = ?, phone = ?, address = ?, skills = ?, availability = ?, status = ? WHERE id = ?',
            [name, email, phone, address, skills, availability, status, req.params.id]
        );
        res.json({ success: true, message: 'Volunteer updated successfully' });
    } catch (error) {
        console.error('Error updating volunteer:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete a volunteer
router.delete('/api/admin/volunteers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM volunteers WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Volunteer deleted successfully' });
    } catch (error) {
        console.error('Error deleting volunteer:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get a single help request's details
router.get('/api/admin/requests/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM help_requests WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Help request not found' });
        }
        res.json({ success: true, item: rows[0] });
    } catch (error) {
        console.error('Error fetching help request:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update a help request's details
router.put('/api/admin/requests/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { title, type, date, time, duration, location, description, is_urgent, status } = req.body;
    try {
        await pool.query(
            'UPDATE help_requests SET title = ?, type = ?, date = ?, time = ?, duration = ?, location = ?, description = ?, is_urgent = ?, status = ? WHERE id = ?',
            [title, type, date, time, duration, location, description, is_urgent, status, req.params.id]
        );
        res.json({ success: true, message: 'Help request updated successfully' });
    } catch (error) {
        console.error('Error updating help request:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete a help request
router.delete('/api/admin/requests/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM help_requests WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Help request deleted successfully' });
    } catch (error) {
        console.error('Error deleting help request:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get a single feedback item
router.get('/api/admin/feedback/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT f.*, u.name as user_name, v.name as volunteer_name 
            FROM feedback f 
            LEFT JOIN users u ON f.user_id = u.id 
            LEFT JOIN volunteers v ON f.volunteer_id = v.id 
            WHERE f.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Feedback not found' });
        }
        res.json({ success: true, item: rows[0] });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete a feedback item
router.delete('/api/admin/feedback/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM feedback WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Feedback not found' });
        }
        res.json({ success: true, message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get a single transaction's details
router.get('/api/admin/transactions/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, u.name as user_name, v.name as volunteer_name 
            FROM transactions t 
            LEFT JOIN users u ON t.user_id = u.id 
            LEFT JOIN volunteers v ON t.volunteer_id = v.id 
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }
        res.json({ success: true, item: rows[0] });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update a transaction's details
router.put('/api/admin/transactions/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { amount, status, payment_method, transaction_ref, notes } = req.body;
    try {
        await pool.query(
            'UPDATE transactions SET amount = ?, status = ?, payment_method = ?, transaction_ref = ?, notes = ? WHERE id = ?',
            [amount, status, payment_method, transaction_ref, notes, req.params.id]
        );
        res.json({ success: true, message: 'Transaction updated successfully' });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get all users
router.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

bcrypt.hash('Admin@123', 10, (err, hash) => {
  if (err) throw err;
  console.log(hash);
});

module.exports = router; 