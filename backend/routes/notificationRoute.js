const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notificationController');
const auth    = require('../middleware/auth');

router.get('/',       auth, ctrl.getNotifications);
router.patch('/read', auth, ctrl.markRead);

module.exports = router;
