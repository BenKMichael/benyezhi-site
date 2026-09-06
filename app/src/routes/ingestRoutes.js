const express = require('express');
const cors = require('../middleware/cors');
const ingestController = require('../controllers/api/ingestController');

const router = express.Router();

router.use(cors);
router.post('/log', ingestController.log);
router.get('/log-noscript', ingestController.logNoscript);

module.exports = router;
