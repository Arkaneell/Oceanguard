const express = require('express');
const router = express.Router();

const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const { verifyUser, updateProfile } = require('../controllers/authController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Verify user after login
router.post('/verify', verifyFirebaseToken, verifyUser);

// Get current user
router.get('/me', verifyFirebaseToken, async (req, res) => {
    const User = require('../models/User');
    const user = await User.findOne({ firebase_uid: req.user.uid });
    res.json(user);
});

// Update profile
router.put('/update', verifyFirebaseToken, upload.single('profile_image'), updateProfile);

module.exports = router;