const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  initiateCall,
  answerCall,
  endCall,
  rejectCall,
  missedCall,
  addIceCandidate,
  getCallById,
  getCallHistory,
  updateCallQuality
} = require('../controllers/callController');

// All routes require authentication
router.use(authMiddleware);

// Get call history
router.get('/history', getCallHistory);

// Initiate a call
router.post('/initiate', initiateCall);

// Routes with :id parameter
router.get('/:id', getCallById);
router.put('/:id/answer', answerCall);
router.put('/:id/end', endCall);
router.put('/:id/reject', rejectCall);
router.put('/:id/missed', missedCall);
router.post('/:id/ice-candidate', addIceCandidate);
router.put('/:id/quality', updateCallQuality);

module.exports = router;