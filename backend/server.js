// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// ================= CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyANirGdTbqkaZiqezn8weXqODe49GlNKps",
    authDomain: "oceanguard1.firebaseapp.com",
    projectId: "oceanguard1",
};

const API_URL = "https://oceanguard-jjos.onrender.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================= NAVBAR SCROLL =================
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.style.padding = '10px 0';
        navbar.style.boxShadow = '0 4px 32px rgba(26,86,255,0.13)';
    } else {
        navbar.style.padding = '14px 0';
        navbar.style.boxShadow = '0 2px 24px rgba(26,86,255,0.06)';
    }
});

// ================= SCROLL REVEAL =================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => {
        if (el.isIntersecting) {
            el.target.classList.add('visible');
            observer.unobserve(el.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .stagger')
    .forEach(el => observer.observe(el));

// ================= PROFILE DROPDOWN =================
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const profileContainer = document.getElementById('profileContainer');

if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown?.classList.toggle('active');
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-container')) {
        profileDropdown?.classList.remove('active');
    }
});

// ================= AUTH STATE =================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (profileContainer) profileContainer.style.display = "none";
        window.location.href = "auth/signin.html";
        return;
    }

    try {
        const idToken = await user.getIdToken(true);

        const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${idToken}`
            }
        });

        if (res.status === 401) {
            await signOut(auth);
            window.location.href = "auth/signin.html";
            return;
        }

        let dbUser = null;
        if (res.ok) {
            dbUser = await res.json();
            console.log("MongoDB User:", dbUser);
        }

        // ================= USER DATA =================
        const displayName = dbUser?.name || user.displayName || "User";
        const email = user.email || "Not provided";
        const phone = user.phoneNumber || "Not added";

        const dob = dbUser?.dob || "";
        const location = dbUser?.location || "";
        const bio = dbUser?.bio || "";

        // ================= UI UPDATE =================
        document.getElementById('dropdownEmail')?.textContent = email;
        document.getElementById('dropdownPhone')?.textContent = phone;
        document.getElementById('userEmail')?.textContent = email;

        const nameEl = document.getElementById("editName");
        const dobEl = document.getElementById("editDOB");
        const locEl = document.getElementById("editLocation");
        const bioEl = document.getElementById("editBio");

        if (nameEl) nameEl.value = displayName;
        if (dobEl) dobEl.value = dob;
        if (locEl) locEl.value = location;
        if (bioEl) bioEl.value = bio;

        // ================= PROFILE IMAGE =================
        const profileImg = document.getElementById("profileImage");
        const headerProfileImg = document.getElementById("headerProfileImage");
        const avatarEl = document.getElementById('profileAvatar');

        if (!profileImg || !headerProfileImg) return;

        if (dbUser?.profile_image) {
            profileImg.src = dbUser.profile_image;
            headerProfileImg.src = dbUser.profile_image;
            profileImg.style.display = "block";
            headerProfileImg.style.display = "block";
            if (avatarEl) avatarEl.style.display = "none";
        } else if (user.photoURL) {
            profileImg.src = user.photoURL;
            headerProfileImg.src = user.photoURL;
            profileImg.style.display = "block";
            headerProfileImg.style.display = "block";
            if (avatarEl) avatarEl.style.display = "none";
        } else {
            profileImg.style.display = "none";
            headerProfileImg.style.display = "none";
            if (avatarEl) {
                avatarEl.textContent = displayName.charAt(0).toUpperCase();
                avatarEl.style.display = "flex";
            }
        }

    } catch (err) {
        console.error("Profile loading failed:", err);
    }
});

// ================= LOGOUT =================
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = "auth/signin.html";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    });
}

// ================= IMAGE PREVIEW =================
const imageInput = document.getElementById("profileImageInput");

if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        document.getElementById('imageLoading')?.style.setProperty("display", "block");
        document.getElementById('imagePreview')?.style.setProperty("display", "none");

        reader.onload = (event) => {
            document.getElementById('imageLoading')?.style.setProperty("display", "none");

            const previewImg = document.getElementById('previewImg');
            if (previewImg) previewImg.src = event.target.result;

            document.getElementById('imagePreview')?.style.setProperty("display", "block");
        };

        reader.readAsDataURL(file);
    });
}

// ================= SAVE PROFILE =================
const saveBtn = document.getElementById("saveProfileBtn");

if (saveBtn) {
    saveBtn.addEventListener("click", async () => {

        const user = auth.currentUser;
        if (!user) return;

        try {
            const idToken = await user.getIdToken(true);

            const formData = new FormData();
            formData.append("name", document.getElementById("editName")?.value || "");
            formData.append("dob", document.getElementById("editDOB")?.value || "");
            formData.append("location", document.getElementById("editLocation")?.value || "");
            formData.append("bio", document.getElementById("editBio")?.value || "");

            if (imageInput?.files[0]) {
                formData.append("profile_image", imageInput.files[0]);
            }

            const res = await fetch(`${API_URL}/api/auth/update`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${idToken}`
                },
                body: formData
            });

            if (!res.ok) throw new Error("Update failed");

            const updatedUser = await res.json();

            alert(" Profile Updated Successfully");

            if (updatedUser.profile_image) {
                document.getElementById("profileImage").src = updatedUser.profile_image;
                document.getElementById("headerProfileImage").src = updatedUser.profile_image;
            }

        } catch (err) {
            console.error("Update error:", err);
            alert(" Profile update failed");
        }
    });
}
