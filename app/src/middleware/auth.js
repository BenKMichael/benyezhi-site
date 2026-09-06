const userModel = require('../models/userModel');
const { roleCan, roleLabel } = require('../config/roles');

function wantsJson(req) {
  return req.originalUrl.startsWith('/api/');
}

async function loadUser(req, res, next) {
  req.user = null;
  res.locals.user = null;
  res.locals.can = () => false;
  res.locals.roleLabel = roleLabel;

  const userId = req.session && req.session.userId;
  if (!userId) {
    return next();
  }

  try {
    const user = await userModel.findById(userId);
    if (user) {
      req.user = user;
      res.locals.user = user;
      res.locals.can = (permission) => roleCan(user.role, permission);
    } else {
      req.session = null;
    }
    next();
  } catch (err) {
    next(err);
  }
}

function requirePermission(permission) {
  return function (req, res, next) {
    if (req.user && roleCan(req.user.role, permission)) {
      return next();
    }
    if (wantsJson(req)) {
      const status = req.user ? 403 : 401;
      return res.status(status).json({
        status: 'error',
        message: status === 403 ? 'Forbidden' : 'Authentication required'
      });
    }
    if (!req.user) {
      return res.redirect('/login');
    }
    return res.status(403).render('error', {
      code: 403,
      title: 'Forbidden',
      message: "You don't have permission to view this page.",
      backHref: '/',
      backLabel: 'Go Home'
    });
  };
}

module.exports = { loadUser, requirePermission };
