const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadErrors,
  cleanupUploadedFiles 
} = require('../middleware/upload');
const {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getUploadLimits
} = require('../controllers/uploadController');

// Routes
router.post('/',
  authMiddleware,
  uploadSingle('file'),
  handleUploadErrors,
  cleanupUploadedFiles,
  uploadFile
);

router.post('/multiple',
  authMiddleware,
  uploadMultiple('files', 10),
  handleUploadErrors,
  cleanupUploadedFiles,
  uploadMultipleFiles
);

router.delete('/:publicId', authMiddleware, deleteFile);
router.get('/limits', authMiddleware, getUploadLimits);

module.exports = router;