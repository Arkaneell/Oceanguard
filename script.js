// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyANirGdTbqkaZiqezn8weXqODe49GlNKps",
    authDomain: "oceanguard1.firebaseapp.com",
    projectId: "oceanguard1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================= NAVBAR SCROLL EFFECT =================
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
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

// Toggle dropdown
if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });
}

// Close dropdown outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-container')) {
        profileDropdown?.classList.remove('active');
    }
});

// ================= AUTH STATE LISTENER =================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (profileContainer) {
            profileContainer.style.display = "none";
        }
        window.location.href = "auth/signin.html";
        return;
    }

    try {
        const idToken = await user.getIdToken();

        const res = await fetch("https://oceanguard-jjos.onrender.com/api/auth/me", {
            headers: {
                Authorization: `Bearer ${idToken}`
            }
        });

        let dbUser = null;

        if (res.ok) {
            dbUser = await res.json();
            console.log("MongoDB User:", dbUser);
        }

        // ================= BASIC INFO =================
        const displayName = dbUser?.name || user.displayName || "User";
        const email = user.email || "Not provided";
        const phone = user.phoneNumber || "Not added";
        const dob = dbUser?.dob || "";
        const location = dbUser?.location || "";
        const bio = dbUser?.bio || "";

        // ================= HEADER DISPLAY =================
        const emailEl = document.getElementById('dropdownEmail');
        const phoneEl = document.getElementById('dropdownPhone');
        const avatarEl = document.getElementById('profileAvatar');
        const emailHeaderEl = document.getElementById('userEmail');
        const headerProfileImg = document.getElementById('headerProfileImage');

        if (emailHeaderEl) emailHeaderEl.textContent = email;
        if (emailEl) emailEl.textContent = email;
        if (phoneEl) phoneEl.textContent = phone;
        
        // ================= EDITABLE FIELDS =================
        document.getElementById("editName").value = displayName;
        document.getElementById("editDOB").value = dob;
        document.getElementById("editLocation").value = location;
        document.getElementById("editBio").value = bio;

        // ================= PROFILE IMAGE =================
        const profileImg = document.getElementById("profileImage");

        if (dbUser?.profile_image) {
            profileImg.src = dbUser.profile_image;
            profileImg.style.display = "block";
            headerProfileImg.src = dbUser.profile_image;
            headerProfileImg.style.display = "block";
            if (avatarEl) avatarEl.style.display = "none";
        } else if (user.photoURL) {
            profileImg.src = user.photoURL;
            profileImg.style.display = "block";
            headerProfileImg.src = user.photoURL;
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

const saveBtn = document.getElementById("saveProfileBtn");
const imageInput = document.getElementById("profileImageInput");
// ================= IMAGE PREVIEW =================
if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            // Show loading
            document.getElementById('imageLoading').style.display = 'block';
            document.getElementById('imagePreview').style.display = 'none';
            
            reader.onload = (event) => {
                // Hide loading
                document.getElementById('imageLoading').style.display = 'none';
                
                // Show preview
                document.getElementById('previewImg').src = event.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            
            reader.readAsDataURL(file);
        }
    });
}
if (saveBtn) {
    saveBtn.addEventListener("click", async () => {

        const user = auth.currentUser;
        if (!user) return;

        const idToken = await user.getIdToken();

        const formData = new FormData();
        formData.append("name", document.getElementById("editName").value);
        formData.append("dob", document.getElementById("editDOB").value);
        formData.append("location", document.getElementById("editLocation").value);
        formData.append("bio", document.getElementById("editBio").value);

        if (imageInput && imageInput.files[0]) {
            formData.append("profile_image", imageInput.files[0]);
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/update", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${idToken}`
                },
                body: formData
            });

            if (!res.ok) {
                alert("Profile update failed");
                return;
            }

            const updatedUser = await res.json();
            alert("Profile Updated Successfully");

            if (updatedUser.profile_image) {
                document.getElementById("profileImage").src = updatedUser.profile_image;
                document.getElementById("headerProfileImage").src = updatedUser.profile_image;
            }

        } catch (err) {
            console.error("Update error:", err);
        }
    });
}
