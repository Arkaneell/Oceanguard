const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebase_uid: { type: String, required: true, unique: true },
    name: String,
    email: String,
    phone: String,
    role: { type: String, default: "user" },
    subscription_plan: { type: String, default: "basic" },
    profile_image: String,
    dob: String,
    bio: String,
    location: String,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);