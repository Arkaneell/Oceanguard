const admin = require('firebase-admin');

// 🔐 Load Base64 encoded credentials from env
const encoded = process.env.GOOGLE_CREDS_B64;

// Decode Base64 → JSON
const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

// Parse JSON
const serviceAccount = JSON.parse(decoded);

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = async (req, res, next) => {
    try {
        console.log("---- VERIFY FIREBASE TOKEN CALLED ----");

        const header = req.headers.authorization;
        console.log("Authorization Header:", header);

        if (!header || !header.startsWith("Bearer ")) {
            console.log("No Bearer token found");
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = header.split("Bearer ")[1];
        console.log("Extracted Token:", token.substring(0, 20), "...");

        const decodedUser = await admin.auth().verifyIdToken(token);
        console.log("Decoded Firebase User:", decodedUser);

        req.user = decodedUser;
        next();

    } catch (error) {
        console.log("TOKEN VERIFICATION ERROR:", error);
        res.status(401).json({ message: "Invalid Token" });
    }
};
