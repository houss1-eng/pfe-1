const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/contractController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/contracts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `contract_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Seuls les fichiers PDF sont acceptés'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

router.post('/save',               auth, ctrl.saveContract);
router.get('/saved',               auth, ctrl.getSavedContracts);
router.post('/send',               auth, upload.single('pdf'), ctrl.sendToClient);
router.get('/',                    auth, ctrl.getContracts);
router.post('/:id/upload-signed',  auth, upload.single('pdf'), ctrl.uploadSigned);
router.post('/:id/return',         auth, ctrl.returnToChef);
router.put('/:id/complete',        auth, ctrl.markCompleted);

module.exports = router;
