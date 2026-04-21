const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'harsh',
    database: process.env.DB_NAME || 'handicare'
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Session store
const sessionStore = new MySQLStore({}, pool);

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET || 'your_session_secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Serve static files - this needs to be before the routes
app.use(express.static(path.join(__dirname)));
app.use('/static', express.static(path.join(__dirname, 'static')));

// Serve HTML files
app.get('/', (req, res) => {
    if (req.session.userId) {
        if (req.session.userRole === 'admin') {
            return res.redirect('/admin_panel');
        } else if (req.session.userRole === 'volunteer') {
            return res.redirect('/volunteer_dashboard');
        } else {
            return res.redirect('/user_dashboard');
        }
    }
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

app.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/user_dashboard');
    }
    res.sendFile(path.join(__dirname, 'templates', 'register.html'));
});

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'feedback.html'));
});

app.get('/emergency', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'emergency.html'));
});

app.get('/user_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'user_dashboard.html'));
});

app.get('/volunteer_dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'templates', 'volunteer_dashboard.html'));
});

app.get('/admin_panel', (req, res) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'templates', 'admin_panel.html'));
});

app.get('/registration_success', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'registration_success.html'));
});

// Serve new request page
app.get('/new_request', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'new_request.html'));
});

app.get('/payment', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login?error=Please login to access payment');
    }
    res.sendFile(path.join(__dirname, 'templates', 'payment.html'));
});

app.get('/api/payment_data', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    try {
        // Fetch completed requests for the logged-in user
        const [requests] = await pool.query(`
            SELECT hr.*, v.name as volunteer_name, v.phone as volunteer_phone
            FROM help_requests hr
            LEFT JOIN volunteers v ON hr.volunteer_id = v.id
            WHERE hr.user_id = ? AND hr.status = 'completed'
            ORDER BY hr.completed_at DESC
        `, [req.session.userId]);

        // Calculate total amount for each request (example: ₹500 per hour)
        const requestsWithAmount = requests.map(request => ({
            ...request,
            amount: request.duration * 500, // ₹500 per hour
            gst: (request.duration * 500) * 0.18, // 18% GST
            total: (request.duration * 500) * 1.18 // Total with GST
        }));

        // Send the data as JSON
        res.json({
            success: true,
            user: {
                name: req.session.userName,
                email: req.session.userEmail
            },
            requests: requestsWithAmount
        });
    } catch (error) {
        console.error('Error fetching payment data:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch payment data' });
    }
});

const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

app.use(dashboardRoutes);
app.use(adminRoutes);

// Handle POST requests
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    
    try {
        let table;
        switch (role) {
            case 'user':
                table = 'users';
                break;
            case 'volunteer':
                table = 'volunteers';
                break;
            case 'admin':
                table = 'admins';
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid role selected' 
                });
        }

        // Get user from database
        const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE email = ?`, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const user = rows[0];
        
        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Store user information in session
        req.session.userId = user.id;
        req.session.userRole = role;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        
        if (role === 'volunteer') {
            req.session.userSkills = user.skills;
            req.session.userAvailability = user.availability;
        } else if (role === 'user') {
            req.session.userDisability = user.disability;
        }

        // Send success response
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login' 
        });
    }
});

app.post('/register', async (req, res) => {
    // Get all possible fields from the form
    let { name, email, phone, password, address, role, disability, skills, availability, admin_secret } = req.body;

    // Ensure all fields are set to null if undefined
    name = name || null;
    email = email || null;
    phone = phone || null;
    password = password || null;
    address = address || null;
    role = role || null;
    disability = disability || null;
    skills = skills || null;
    availability = availability || null;
    admin_secret = admin_secret || null;

    try {
        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.redirect('/register?error=Name, email, password, and role are required');
        }

        // Admin registration
        if (role === 'admin') {
            // You can set your own admin secret code here
            const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || 'handicare2024';
            if (admin_secret !== ADMIN_SECRET_CODE) {
                return res.redirect('/register?error=Invalid admin secret code');
            }
            // Check if email already exists in admins table
            const [existingAdmin] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
            if (existingAdmin.length > 0) {
                return res.redirect('/register?error=Email already exists');
            }
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await pool.execute(
                'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword]
            );
            return res.redirect('/registration_success');
        }

        // Check if email already exists in users or volunteers
        let table;
        switch (role) {
            case 'user':
                table = 'users';
                break;
            case 'volunteer':
                table = 'volunteers';
                break;
            default:
                return res.redirect('/register?error=Invalid role selected');
        }

        const [existingUser] = await pool.execute(`SELECT * FROM ${table} WHERE email = ?`, [email]);
        if (existingUser.length > 0) {
            return res.redirect('/register?error=Email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user or volunteer data
        if (role === 'user') {
            await pool.execute(
                'INSERT INTO users (name, email, phone, password, address, disability) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    name,
                    email,
                    phone,
                    hashedPassword,
                    address,
                    disability
                ]
            );
        } else if (role === 'volunteer') {
            // For volunteers, convert skills and availability to JSON if they're strings
            const processedSkills = typeof skills === 'string' ? skills : JSON.stringify(skills || []);
            const processedAvailability = typeof availability === 'string' ? availability : JSON.stringify(availability || []);
            await pool.execute(
                'INSERT INTO volunteers (name, email, phone, password, address, skills, availability) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    name,
                    email,
                    phone,
                    hashedPassword,
                    address,
                    processedSkills,
                    processedAvailability
                ]
            );
        }

        // Redirect to success page
        res.redirect('/registration_success');
    } catch (error) {
        console.error('Registration error:', error);
        res.redirect('/register?error=An error occurred during registration. Please try again.');
    }
});

app.post('/feedback', async (req, res) => {
    const { name, email, feedback, rating } = req.body;
    const type = 'general';
    try {
        await pool.execute(
            'INSERT INTO general_feedback (name, email, type, comment, rating) VALUES (?, ?, ?, ?, ?)',
            [name, email, type, feedback, rating]
        );
        res.redirect('/?success_msg=Thank you for your feedback!');
    } catch (error) {
        console.error(error);
        res.redirect('/feedback?error_msg=An error occurred. Please try again.');
    }
});

// Admin API Endpoints
app.get('/api/user/info', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    res.json({
        success: true,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
    });
});

app.get('/api/admin/stats', async (req, res) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    try {
        // Get total users
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        
        // Get total volunteers
        const [volunteerCount] = await pool.execute('SELECT COUNT(*) as count FROM volunteers');
        
        // Get active requests
        const [requestCount] = await pool.execute('SELECT COUNT(*) as count FROM requests WHERE status = "active"');
        
        // Get average rating
        const [ratingResult] = await pool.execute('SELECT AVG(rating) as average FROM feedback');

        res.json({
            success: true,
            stats: {
                totalUsers: userCount[0].count,
                totalVolunteers: volunteerCount[0].count,
                activeRequests: requestCount[0].count,
                averageRating: ratingResult[0].average ? ratingResult[0].average.toFixed(1) : '0.0'
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

// Export endpoints
app.get('/api/admin/export/users', async (req, res) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    try {
        const [users] = await pool.execute('SELECT * FROM users');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({ success: false, message: 'Error exporting data' });
    }
});

app.get('/api/admin/export/feedback', async (req, res) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    try {
        const [feedback] = await pool.execute('SELECT * FROM feedback');
        res.json({ success: true, data: feedback });
    } catch (error) {
        console.error('Error exporting feedback data:', error);
        res.status(500).json({ success: false, message: 'Error exporting data' });
    }
});

app.get('/api/admin/reports/requests', async (req, res) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    try {
        const [requests] = await pool.execute(`
            SELECT r.*, u.name as user_name, v.name as volunteer_name 
            FROM requests r 
            LEFT JOIN users u ON r.user_id = u.id 
            LEFT JOIN volunteers v ON r.volunteer_id = v.id
        `);
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error generating request report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
});

// Add logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'templates', '404.html'));
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
}); 