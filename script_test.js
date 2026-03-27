// ================= NAVBAR SCROLL EFFECT =================
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

// Toggle dropdown
if (profileBtn && profileDropdown) {
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

// ================= DUMMY USER (NO AUTH) =================
const dummyUser = {
    name: "Guest User",
    email: "guest@oceanguard.com",
    phone: "Not provided",
    dob: "",
    location: "",
    bio: "",
    profile_image: ""
};

// ================= LOAD PROFILE DATA =================
function loadProfile() {

    const displayName = dummyUser.name;
    const email = dummyUser.email;
    const phone = dummyUser.phone;
    const dob = dummyUser.dob;
    const location = dummyUser.location;
    const bio = dummyUser.bio;

    // Header elements
    const emailEl = document.getElementById('dropdownEmail');
    const phoneEl = document.getElementById('dropdownPhone');
    const avatarEl = document.getElementById('profileAvatar');
    const emailHeaderEl = document.getElementById('userEmail');
    const headerProfileImg = document.getElementById('headerProfileImage');

    if (emailHeaderEl) emailHeaderEl.textContent = email;
    if (emailEl) emailEl.textContent = email;
    if (phoneEl) phoneEl.textContent = phone;

    // Editable fields
    if (document.getElementById("editName")) {
        document.getElementById("editName").value = displayName;
        document.getElementById("editDOB").value = dob;
        document.getElementById("editLocation").value = location;
        document.getElementById("editBio").value = bio;
    }

    // Profile image
    const profileImg = document.getElementById("profileImage");

    if (dummyUser.profile_image) {
        profileImg.src = dummyUser.profile_image;
        profileImg.style.display = "block";
        headerProfileImg.src = dummyUser.profile_image;
        headerProfileImg.style.display = "block";
        if (avatarEl) avatarEl.style.display = "none";
    } else {
        profileImg?.style && (profileImg.style.display = "none");
        headerProfileImg?.style && (headerProfileImg.style.display = "none");

        if (avatarEl) {
            avatarEl.textContent = displayName.charAt(0).toUpperCase();
            avatarEl.style.display = "flex";
        }
    }
}

// ================= IMAGE PREVIEW =================
const imageInput = document.getElementById("profileImageInput");

if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];

        if (file) {
            const reader = new FileReader();

            document.getElementById('imageLoading').style.display = 'block';
            document.getElementById('imagePreview').style.display = 'none';

            reader.onload = (event) => {
                document.getElementById('imageLoading').style.display = 'none';
                document.getElementById('previewImg').src = event.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };

            reader.readAsDataURL(file);
        }
    });
}

// ================= SAVE PROFILE (LOCAL ONLY) =================
const saveBtn = document.getElementById("saveProfileBtn");

if (saveBtn) {
    saveBtn.addEventListener("click", () => {

        const name = document.getElementById("editName")?.value;
        const dob = document.getElementById("editDOB")?.value;
        const location = document.getElementById("editLocation")?.value;
        const bio = document.getElementById("editBio")?.value;

        console.log("Saved Data:", { name, dob, location, bio });

        alert("Profile saved locally (No backend)");
    });
}

// ================= INIT =================
(function init() {
    loadProfile();
})();
