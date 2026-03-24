require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const riskRoutes = require('./routes/riskRoutes');
const authRoutes = require('./routes/authRoutes');   // ✅ ADD THIS

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.use('/api/risks', riskRoutes);
app.use('/api/auth', authRoutes);   // ✅ ADD THIS

app.listen(5000, () => console.log('Server running on port 5000'));

console.log("Cloudinary Name:", process.env.CLOUDINARY_CLOUD_NAME);
