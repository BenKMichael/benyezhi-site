const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

router.get('/reports/graceful-degradation', requireAuth, reportController.getDegradationReport);

module.exports = router;