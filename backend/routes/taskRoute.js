const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const taskController = require('../controllers/taskController');
const auth    = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(__dirname, '../uploads', req.params.id, req.params.role || 'general');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/',        auth, taskController.getTasks);
router.post('/',       auth, taskController.createTask);
router.put('/:id',     auth, taskController.updateTask);
router.delete('/:id',  auth, taskController.deleteTask);
router.post('/:id/assign', auth, taskController.assignTask);
router.post('/:id/upload/:role', auth, upload.array('files', 10), taskController.uploadFiles);

module.exports = router;
