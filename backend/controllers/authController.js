const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');


exports.verifyUser = async (req, res) => {
    try {
        const { uid, name, email, phone_number } = req.user;

        let user = await User.findOne({ firebase_uid: uid });

        if (!user) {
            user = await User.create({
                firebase_uid: uid,
                name: name || "",
                email: email || "",
                phone: phone_number || ""
            });
        }

        res.status(200).json({ message: "User verified", user });
        console.log("---- CONTROLLER CALLED ----");
        console.log("User from middleware:", req.user);

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.updateProfile = async (req, res) => {
    try {
        console.log("---- UPDATE PROFILE CALLED ----");
        console.log("User:", req.user);
        console.log("Body:", req.body);
        console.log("File:", req.file);

        const userId = req.user.uid;

        let updateData = {
            name: req.body.name,
            dob: req.body.dob,
            bio: req.body.bio,
            location: req.body.location
        };

        if (req.file) {
            console.log("Uploading to Cloudinary...");

            const uploadFromBuffer = (buffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "oceanguard_profiles" },
                        (error, result) => {
                            if (error) {
                                console.log("Cloudinary error:", error);
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                    streamifier.createReadStream(buffer).pipe(stream);
                });
            };

            const result = await uploadFromBuffer(req.file.buffer);
            updateData.profile_image = result.secure_url;
        }

        const updatedUser = await User.findOneAndUpdate(
            { firebase_uid: userId },
            updateData,
            { new: true }
        );

        res.json(updatedUser);

    } catch (err) {
        console.log("UPDATE ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};