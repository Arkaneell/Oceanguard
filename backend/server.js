require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const riskRoutes = require('./routes/riskRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

/* ================= CORS CONFIG ================= */
// 🔥 For testing (allow all)
/*
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
*/
// 👉 For production (uncomment and replace your domain)
app.use(cors({
  origin: "https://ocean-guard.netlify.app/",
  methods: ["GET", "POST"],
  credentials: true
}));


/* ================= MIDDLEWARE ================= */
app.use(express.json());

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

/* ================= ROUTES ================= */
app.use('/api/risks', riskRoutes);
app.use('/api/auth', authRoutes);

/* ================= ROOT ROUTE ================= */
app.get('/', (req, res) => {
  res.send(" OceanGuard API is running successfully 🚀");
});

/* ================= HEALTH CHECK ================= */
app.get('/health', (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});

/* ================= DEBUG (OPTIONAL) ================= */
console.log("Cloudinary Name:", process.env.CLOUDINARY_CLOUD_NAME || "Not Set");
