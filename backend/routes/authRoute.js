const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const authController = require('../controllers/authController');
const auth     = require('../middleware/auth');

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/login',         authController.login);
router.get('/me',             auth, authController.getMe);
router.put('/me',             auth, authController.updateProfile);
router.post('/avatar',        auth, uploadAvatar.single('avatar'), authController.uploadAvatar);
router.delete('/me',          auth, authController.deleteAccount);
router.post('/register',      auth, authController.register);
router.get('/users',          auth, authController.getUsers);
router.delete('/users/:id',   auth, authController.deleteUser);
router.put('/password',       auth, authController.changePassword);

module.exports = router;
