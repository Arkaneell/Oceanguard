const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json');

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

        const decoded = await admin.auth().verifyIdToken(token);
        console.log("Decoded Firebase User:", decoded);

        req.user = decoded;
        next();

    } catch (error) {
        console.log("TOKEN VERIFICATION ERROR:", error);
        res.status(401).json({ message: "Invalid Token" });
    }
};