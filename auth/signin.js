// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// ================= CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyANirGdTbqkaZiqezn8weXqODe49GlNKps",
    authDomain: "oceanguard1.firebaseapp.com",
    projectId: "oceanguard1",
};

const API_URL = "https://oceanguard-jjos.onrender.com";

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================= DOM =================
const googleBtn = document.getElementById("googleLogin");
const sendOtpBtn = document.getElementById("sendOtp");
const verifyOtpBtn = document.getElementById("verifyOtp");
const phoneInput = document.getElementById("phoneNumber");
const otpInput = document.getElementById("otpCode");
const otpContainer = document.getElementById("otpContainer");
const errorMessage = document.getElementById("errorMessage");

// ================= GOOGLE LOGIN =================
if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const idToken = await result.user.getIdToken(true);
            await sendTokenToBackend(idToken);

        } catch (error) {
            console.error("Google Login Error:", error);
            errorMessage.textContent = error.message;
        }
    });
}

// ================= PHONE OTP =================
if (sendOtpBtn && verifyOtpBtn) {

    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible'
    }, auth);

    sendOtpBtn.addEventListener("click", async () => {
        try {
            if (!phoneInput.value) {
                errorMessage.textContent = "Enter phone number";
                return;
            }

            const confirmationResult = await signInWithPhoneNumber(
                auth,
                phoneInput.value,
                window.recaptchaVerifier
            );

            window.confirmationResult = confirmationResult;
            otpContainer.classList.remove("hidden");

        } catch (error) {
            console.error("OTP Send Error:", error);
            errorMessage.textContent = error.message;
        }
    });

    verifyOtpBtn.addEventListener("click", async () => {
        try {
            if (!otpInput.value) {
                errorMessage.textContent = "Enter OTP";
                return;
            }

            const result = await window.confirmationResult.confirm(otpInput.value);

            const idToken = await result.user.getIdToken(true);
            await sendTokenToBackend(idToken);

        } catch (error) {
            console.error("OTP Verify Error:", error);
            errorMessage.textContent = "Invalid OTP";
        }
    });
}

// ================= SEND TOKEN =================
async function sendTokenToBackend(idToken) {
    try {
        const res = await fetch(`${API_URL}/api/auth/verify`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${idToken}`
            }
        });

        if (!res.ok) {
            throw new Error("Authentication failed");
        }

        const data = await res.json();
        console.log("Backend response:", data);

        // ✅ Redirect after login
        window.location.href = "https://ocean-guard.netlify.app/";

    } catch (error) {
        console.error("Backend Auth Error:", error);
        errorMessage.textContent = "Authentication failed. Try again.";
    }
}
