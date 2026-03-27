import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

/* 🔥 REPLACE WITH YOUR FIREBASE CONFIG */
const firebaseConfig = {
    apiKey: process.env-auth.FIREBASE_API_KEY,
    authDomain: "oceanguard1.firebaseapp.com",
    projectId: "oceanguard1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleBtn = document.getElementById("googleLogin");
const sendOtpBtn = document.getElementById("sendOtp");
const verifyOtpBtn = document.getElementById("verifyOtp");
const phoneInput = document.getElementById("phoneNumber");
const otpInput = document.getElementById("otpCode");
const otpContainer = document.getElementById("otpContainer");
const errorMessage = document.getElementById("errorMessage");

/* Google Login */
googleBtn.addEventListener("click", async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();
        await sendTokenToBackend(idToken);
    } catch (error) {
        errorMessage.textContent = error.message;
    }
});

/* Phone OTP */
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    size: 'invisible'
}, auth);

sendOtpBtn.addEventListener("click", async () => {
    try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneInput.value, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        otpContainer.classList.remove("hidden");
    } catch (error) {
        errorMessage.textContent = error.message;
    }
});

verifyOtpBtn.addEventListener("click", async () => {
    try {
        const result = await window.confirmationResult.confirm(otpInput.value);
        const idToken = await result.user.getIdToken();
        await sendTokenToBackend(idToken);
    } catch (error) {
        errorMessage.textContent = "Invalid OTP";
    }
});

/* Send Token to Backend */
async function sendTokenToBackend(idToken) {
    const res = await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    if (res.ok) {
        window.location.href = "../index.html";
    } else {
        errorMessage.textContent = "Authentication failed.";

    }
    console.log("Sending ID Token to backend:", idToken);
}