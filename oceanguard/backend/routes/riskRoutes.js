const express = require('express');
const multer = require('multer');
const { createRisk, getAllRisks } = require('../controllers/riskController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), createRisk);
router.get('/', getAllRisks);   // 👈 ADD THIS

module.exports = router;