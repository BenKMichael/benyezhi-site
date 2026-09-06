const express = require('express');
const demoSession = require('../middleware/demoSession');
const demoController = require('../controllers/demoController');

const router = express.Router();

router.get('/hello-html', demoController.helloHtml);
router.get('/hello-json', demoController.helloJson);
router.get('/env', demoController.env);
router.all('/echo', express.text({ type: '*/*' }), demoController.echo);

router.use(demoSession);
router.get('/session', demoController.sessionForm);
router.post('/session', express.urlencoded({ extended: true }), demoController.sessionSave);
router.get('/session-check', demoController.sessionCheck);
router.get('/session-clear', demoController.sessionClear);

module.exports = router;
