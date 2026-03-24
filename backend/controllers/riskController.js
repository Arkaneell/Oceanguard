const Risk = require('../models/risk');
const cloudinary = require('../config/cloudinary');

exports.createRisk = async (req, res) => {
  try {

    let imageUrl = null;

    // Upload to Cloudinary
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        { folder: 'oceanguard' }
      );
      imageUrl = uploaded.secure_url;
    }

    const { description, lat, lng, label } = req.body;

    // 🔥 Replace with your AI model call
    const risk_score = Math.floor(Math.random() * 100);

    const risk_level =
      risk_score <= 30 ? 'low' :
      risk_score <= 60 ? 'moderate' :
      risk_score <= 80 ? 'high' :
      'critical';

    const risk = await Risk.create({
      image_url: imageUrl,
      description,
      location: { lat, lng, label },
      risk_score,
      risk_level
    });

    res.status(201).json({
      risk_score,
      risk_level
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};
exports.getAllRisks = async (req, res) => {
  try {
    const risks = await Risk.find().sort({ created_at: -1 });
    res.json(risks);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};