const { ROLES } = require('../config/constants');

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === ROLES.ADMIN) {
        return next();
    }
    return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access only' });
}

module.exports = {
    ROLES,
    requireAuth,
    requireAdmin
};
