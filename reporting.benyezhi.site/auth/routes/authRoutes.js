const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, authController.getHome);
router.get('/users', requireAdmin, authController.getUsers);
router.get('/users/new', requireAdmin, authController.getNewUser);
router.post('/users', requireAdmin, authController.createUser);
router.get('/users/:id/edit', requireAdmin, authController.getEditUser);
router.post('/users/:id/update', requireAdmin, authController.updateUser);
router.post('/users/:id/delete', requireAdmin, authController.deleteUser);
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

module.exports = router;