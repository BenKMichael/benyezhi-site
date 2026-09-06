const express = require('express');

const router = express.Router();

router.use('/', require('./ingestRoutes'));
router.use('/api', require('./apiRoutes'));
router.use('/', require('./pageRoutes'));

module.exports = router;
