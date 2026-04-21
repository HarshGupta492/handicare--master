const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { isAuthenticated } = require('../middleware/auth');

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

// Get user profile
router.get('/api/profile', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, phone, address, disability FROM users WHERE id = ?', [req.session.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, user: rows[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update user profile
router.put('/api/profile', isAuthenticated, async (req, res) => {
    const { name, email, phone, address, disability, currentPassword, newPassword } = req.body;
    
    try {
        if (newPassword) {
            // Verify current password
            const [user] = await pool.query('SELECT password FROM users WHERE id = ?', [req.session.userId]);
            const validPassword = await bcrypt.compare(currentPassword, user[0].password);
            if (!validPassword) {
                return res.status(400).json({ success: false, error: 'Current password is incorrect' });
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query(
                'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, disability = ?, password = ? WHERE id = ?',
                [name, email, phone, address, disability, hashedPassword, req.session.userId]
            );
        } else {
            await pool.query(
                'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, disability = ? WHERE id = ?',
                [name, email, phone, address, disability, req.session.userId]
            );
        }
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get emergency contacts
router.get('/api/emergency_contacts', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM emergency_contacts WHERE user_id = ?', [req.session.userId]);
        res.json({ success: true, contacts: rows });
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Add emergency contact
router.post('/api/emergency_contacts', isAuthenticated, async (req, res) => {
    const { name, relationship, phone, email } = req.body;
    
    try {
        const [result] = await pool.query(
            'INSERT INTO emergency_contacts (user_id, name, relationship, phone, email) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, name, relationship, phone, email]
        );
        res.json({ success: true, contactId: result.insertId });
    } catch (error) {
        console.error('Error adding emergency contact:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete emergency contact
router.delete('/api/emergency_contacts/:id', isAuthenticated, async (req, res) => {
    try {
        await pool.query('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting emergency contact:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get user feedback
router.get('/api/feedback', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT f.*, v.name as volunteer_name FROM feedback f LEFT JOIN volunteers v ON f.volunteer_id = v.id WHERE f.user_id = ?',
            [req.session.userId]
        );
        res.json({ success: true, feedback: rows });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Create help request
router.post('/api/help_requests', isAuthenticated, async (req, res) => {
    const { title, type, date, time, duration, location, description, is_urgent } = req.body;
    
    try {
        // Calculate start_time and end_time
        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 60 * 1000));

        const [result] = await pool.query(
            'INSERT INTO help_requests (user_id, title, type, date, time, duration, location, description, is_urgent, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.session.userId, title, type, date, time, duration, location, description, is_urgent, startDateTime, endDateTime]
        );
        res.json({ success: true, requestId: result.insertId });
    } catch (error) {
        console.error('Error creating help request:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get user's help requests
router.get('/api/help_requests', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT r.*, v.name as volunteer_name FROM help_requests r LEFT JOIN volunteers v ON r.volunteer_id = v.id WHERE r.user_id = ? ORDER BY r.created_at DESC',
            [req.session.userId]
        );
        // Add is_paid field based on payment_status
        const requests = rows.map(request => ({
            ...request,
            is_paid: request.payment_status === 'completed'
        }));
        res.json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching help requests:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update help request status
router.put('/api/help_requests/:id', isAuthenticated, async (req, res) => {
    const { status } = req.body;
    
    try {
        await pool.query(
            'UPDATE help_requests SET status = ? WHERE id = ? AND user_id = ?',
            [status, req.params.id, req.session.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating help request:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get volunteer performance data
router.get('/api/volunteer/performance', isAuthenticated, async (req, res) => {
    try {
        const period = req.query.period || 'month';
        let timeFilter = '';
        
        switch(period) {
            case 'month':
                timeFilter = 'AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
                break;
            case '3months':
                timeFilter = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
                break;
            case '6months':
                timeFilter = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
                break;
            case 'year':
                timeFilter = 'AND YEAR(created_at) = YEAR(CURDATE())';
                break;
            case 'all':
                timeFilter = '';
                break;
        }

        // Get tasks by type
        const [tasksByType] = await pool.query(`
            SELECT r.type, COUNT(*) as count
            FROM help_requests r
            WHERE r.volunteer_id = ? ${timeFilter.replace('created_at', 'r.created_at')}
            GROUP BY r.type
        `, [req.session.userId]);

        // Get monthly activity
        const [monthlyActivity] = await pool.query(`
            SELECT 
                DATE_FORMAT(r.created_at, '%Y-%m') as month,
                COUNT(*) as completed_tasks
            FROM help_requests r
            WHERE r.volunteer_id = ? 
            AND r.status = 'completed'
            ${timeFilter.replace('created_at', 'r.created_at')}
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `, [req.session.userId]);

        // Get rating history
        const [ratingHistory] = await pool.query(`
            SELECT 
                DATE_FORMAT(f.created_at, '%Y-%m') as month,
                AVG(f.rating) as average_rating,
                COUNT(*) as total_ratings
            FROM feedback f
            WHERE f.volunteer_id = ? ${timeFilter.replace('created_at', 'f.created_at')}
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `, [req.session.userId]);

        // Get overall statistics
        const [totalTasks] = await pool.query(`
            SELECT COUNT(*) as count
            FROM help_requests r
            WHERE r.volunteer_id = ? ${timeFilter.replace('created_at', 'r.created_at')}
        `, [req.session.userId]);

        const [completedTasks] = await pool.query(`
            SELECT COUNT(*) as count
            FROM help_requests r
            WHERE r.volunteer_id = ? 
            AND r.status = 'completed' ${timeFilter.replace('created_at', 'r.created_at')}
        `, [req.session.userId]);

        const [averageRating] = await pool.query(`
            SELECT AVG(f.rating) as avg_rating, COUNT(*) as total_ratings
            FROM feedback f
            WHERE f.volunteer_id = ? ${timeFilter.replace('created_at', 'f.created_at')}
        `, [req.session.userId]);

        const [hoursVolunteered] = await pool.query(`
            SELECT COALESCE(SUM(
                CASE 
                    WHEN r.start_time IS NOT NULL AND r.end_time IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, r.start_time, r.end_time)
                    ELSE r.duration
                END
            ), 0) as total_hours
            FROM help_requests r
            WHERE r.volunteer_id = ? 
            AND r.status = 'completed'
            ${timeFilter.replace('created_at', 'r.created_at')}
        `, [req.session.userId]);

        res.json({
            success: true,
            performance: {
                tasksByType,
                monthlyActivity,
                ratingHistory,
                stats: {
                    totalTasks: totalTasks[0].count,
                    completedTasks: completedTasks[0].count,
                    averageRating: averageRating[0].avg_rating || 0,
                    totalRatings: averageRating[0].total_ratings || 0,
                    hoursVolunteered: hoursVolunteered[0].total_hours || 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching volunteer performance:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get list of volunteers for feedback
router.get('/api/volunteers', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                v.id, 
                v.name,
                v.email,
                v.phone,
                (SELECT COUNT(*) FROM help_requests hr WHERE hr.volunteer_id = v.id AND hr.status = 'completed') as completed_tasks,
                (SELECT AVG(rating) FROM feedback f WHERE f.volunteer_id = v.id) as average_rating
            FROM volunteers v 
            ORDER BY v.name ASC
        `);
        
        // Format the response data
        const volunteers = rows.map(volunteer => ({
            id: volunteer.id,
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone,
            stats: {
                completedTasks: volunteer.completed_tasks || 0,
                averageRating: volunteer.average_rating ? parseFloat(volunteer.average_rating).toFixed(1) : '0.0'
            }
        }));

        res.json({ success: true, volunteers });
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Add new feedback
router.post('/api/feedback', isAuthenticated, async (req, res) => {
    const { volunteer_id, rating, comment, is_public } = req.body;
    
    try {
        // Verify that the user has completed a request with this volunteer
        const [request] = await pool.query(
            'SELECT id FROM help_requests WHERE user_id = ? AND volunteer_id = ? AND status = ?',
            [req.session.userId, volunteer_id, 'completed']
        );
        
        if (request.length === 0) {
            return res.status(400).json({ success: false, error: 'You can only provide feedback for completed requests' });
        }

        const [result] = await pool.query(
            'INSERT INTO feedback (user_id, volunteer_id, rating, comment, is_public) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, volunteer_id, rating, comment, is_public]
        );
        
        res.json({ success: true, feedbackId: result.insertId });
    } catch (error) {
        console.error('Error adding feedback:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update feedback
router.put('/api/feedback/:id', isAuthenticated, async (req, res) => {
    const { rating, comment, is_public } = req.body;
    
    try {
        const [result] = await pool.query(
            'UPDATE feedback SET rating = ?, comment = ?, is_public = ? WHERE id = ? AND user_id = ?',
            [rating, comment, is_public, req.params.id, req.session.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Feedback not found or unauthorized' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete feedback
router.delete('/api/feedback/:id', isAuthenticated, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM feedback WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Feedback not found or unauthorized' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get assigned help requests for volunteer
router.get('/api/volunteer/assigned-requests', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                r.*,
                u.name as requester_name,
                u.phone as requester_phone,
                u.email as requester_email,
                u.address as requester_address,
                u.disability as requester_disability
            FROM help_requests r
            INNER JOIN users u ON r.user_id = u.id
            WHERE r.volunteer_id = ?
            ORDER BY 
                CASE 
                    WHEN r.status = 'pending' THEN 1
                    WHEN r.status = 'accepted' THEN 2
                    WHEN r.status = 'in_progress' THEN 3
                    WHEN r.status = 'completed' THEN 4
                    ELSE 5
                END,
                r.created_at DESC
        `, [req.session.userId]);

        // Format the response data
        const requests = rows.map(request => ({
            id: request.id,
            title: request.title,
            type: request.type,
            date: request.date,
            time: request.time,
            duration: request.duration,
            location: request.location,
            description: request.description,
            is_urgent: request.is_urgent,
            status: request.status,
            created_at: request.created_at,
            start_time: request.start_time,
            end_time: request.end_time,
            requester: {
                name: request.requester_name,
                phone: request.requester_phone,
                email: request.requester_email,
                address: request.requester_address,
                disability: request.requester_disability
            }
        }));

        res.json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching assigned requests:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update help request status by volunteer
router.put('/api/volunteer/help-requests/:id', isAuthenticated, async (req, res) => {
    const { status } = req.body;
    const requestId = req.params.id;
    
    try {
        // Verify the request is assigned to this volunteer
        const [request] = await pool.query(
            'SELECT * FROM help_requests WHERE id = ? AND volunteer_id = ?',
            [requestId, req.session.userId]
        );

        if (request.length === 0) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this request' });
        }

        // Update the status
        await pool.query(
            'UPDATE help_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, requestId]
        );

        // If status is completed, update the completion time
        if (status === 'completed') {
            await pool.query(
                'UPDATE help_requests SET completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                [requestId]
            );
        }

        res.json({ success: true, message: 'Request status updated successfully' });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Accept help request by volunteer
router.post('/api/volunteer/accept-request/:id', isAuthenticated, async (req, res) => {
    const requestId = req.params.id;
    
    try {
        // Check if request is already assigned
        const [request] = await pool.query(
            'SELECT * FROM help_requests WHERE id = ? AND (volunteer_id IS NULL OR status = "pending")',
            [requestId]
        );

        if (request.length === 0) {
            return res.status(400).json({ success: false, error: 'Request is already assigned or not available' });
        }

        // Assign the request to the volunteer
        await pool.query(
            'UPDATE help_requests SET volunteer_id = ?, status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [req.session.userId, requestId]
        );

        res.json({ success: true, message: 'Request accepted successfully' });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get available help requests for volunteers
router.get('/api/volunteer/available-requests', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                r.*,
                u.name as requester_name,
                u.disability as requester_disability,
                (
                    SELECT COUNT(*) 
                    FROM help_requests 
                    WHERE user_id = r.user_id AND status = 'completed'
                ) as requester_completed_requests
            FROM help_requests r
            INNER JOIN users u ON r.user_id = u.id
            WHERE r.volunteer_id IS NULL 
            AND r.status = 'pending'
            ORDER BY 
                r.is_urgent DESC,
                r.created_at ASC
        `);

        // Format the response data
        const requests = rows.map(request => ({
            id: request.id,
            title: request.title,
            type: request.type,
            date: request.date,
            time: request.time,
            duration: request.duration,
            location: request.location,
            description: request.description,
            is_urgent: request.is_urgent,
            created_at: request.created_at,
            requester: {
                name: request.requester_name,
                disability: request.requester_disability,
                completedRequests: request.requester_completed_requests
            }
        }));

        res.json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching available requests:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Payment endpoint: record a transaction after task completion
router.post('/api/payments', isAuthenticated, async (req, res) => {
    const { request_id, amount, method } = req.body;
    if (!request_id || !amount || !method) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Validate payment method
    const validMethods = ['Cash', 'UPI', 'Card', 'online'];
    if (!validMethods.includes(method)) {
        return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    try {
        // Check if request exists and is completed
        const [requestRows] = await pool.query(
            'SELECT * FROM help_requests WHERE id = ? AND status = ?',
            [request_id, 'completed']
        );
        
        if (requestRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Request not found or not completed' });
        }

        // Check if payment already exists
        const [existingPayment] = await pool.query(
            'SELECT * FROM transactions WHERE request_id = ? AND status = ?',
            [request_id, 'completed']
        );

        if (existingPayment.length > 0) {
            return res.status(400).json({ success: false, error: 'Payment already processed for this request' });
        }

        const request = requestRows[0];
        const volunteer_id = request.volunteer_id;

        // Create transaction record
        const [result] = await pool.query(
            'INSERT INTO transactions (user_id, volunteer_id, request_id, amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.session.userId, volunteer_id, request_id, amount, method, 'completed']
        );

        // Update help_requests to mark as paid
        await pool.query(
            'UPDATE help_requests SET payment_status = ? WHERE id = ?',
            ['completed', request_id]
        );

        res.json({ 
            success: true, 
            message: 'Payment successful and transaction recorded.',
            transaction_id: result.insertId
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router; 