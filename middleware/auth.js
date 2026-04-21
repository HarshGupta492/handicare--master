// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Not authenticated' });
    }
};

module.exports = { isAuthenticated }; 