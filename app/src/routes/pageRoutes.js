const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const reportController = require('../controllers/reportController');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

router.get('/', requirePermission('reports:view'), reportController.list);
router.get('/reports/new', requirePermission('reports:create'), reportController.newPicker);
router.get('/reports/new/:type', requirePermission('reports:create'), reportController.newWorkspace);
router.post('/reports', requirePermission('reports:create'), reportController.save);
router.get('/reports/:id/download', requirePermission('reports:view'), reportController.downloadSaved);
router.post('/reports/:id/delete', requirePermission('reports:delete'), reportController.remove);

router.get('/users', requirePermission('users:access'), userController.list);
router.get('/users/new', requirePermission('users:access'), userController.newForm);
router.post('/users', requirePermission('users:access'), userController.create);
router.get('/users/:id/edit', requirePermission('users:access'), userController.editForm);
router.post('/users/:id/update', requirePermission('users:access'), userController.update);
router.post('/users/:id/delete', requirePermission('users:access'), userController.remove);

module.exports = router;
