const express = require('express');
const staticController = require('../controllers/api/staticController');
const eventController = require('../controllers/api/eventController');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/static', requirePermission('reports:view'), staticController.list);
router.get('/static/:identifier', requirePermission('reports:view'), staticController.get);
router.post('/static', requirePermission('events:write'), staticController.create);
router.delete('/static/:id', requirePermission('events:write'), staticController.remove);

router.get('/events', requirePermission('reports:view'), eventController.list);
router.get('/session/:sessionId/timeline', requirePermission('reports:view'), eventController.timeline);

module.exports = router;
