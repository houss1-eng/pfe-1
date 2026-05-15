const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.post('/register', auth, authController.register);
router.get('/users', auth, authController.getUsers);
router.delete('/users/:id', auth, authController.deleteUser);
router.put('/password', auth, authController.changePassword);

module.exports = router;
