document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "user_login.html";
        return;
    }

    const form = document.getElementById("profileForm");
    const editBtn = document.getElementById("editToggleBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const statusMsg = document.getElementById("profileStatus");

    // Initialize with current user data
    loadUserData(user);

    // Fetch full profile from backend
    await fetchFullProfile(user.id);

    // Toggle Edit Mode
    editBtn.onclick = () => enableEdit(true);
    cancelBtn.onclick = () => {
        enableEdit(false);
        loadUserData(JSON.parse(localStorage.getItem("user")));
    };

    // Profile Picture Upload Logic
    const picInput = document.getElementById("profilePicInput");
    const profilePic = document.getElementById("profilePic");

    picInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profilePic.src = e.target.result;
                // Here you would typically upload the file to your backend
                // uploadProfilePicture(file); 
            };
            reader.readAsDataURL(file);
        }
    });

    function enableEdit(isEditing) {
        if (isEditing) {
            form.classList.remove("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => {
                if (el.id !== "profileEmail") el.removeAttribute("readonly");
            });
            editBtn.style.display = "none";
            statusMsg.textContent = "Updating your professional details...";
            statusMsg.style.color = "var(--primary-blue)";
        } else {
            form.classList.add("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => el.setAttribute("readonly", true));
            editBtn.style.display = "block";
            statusMsg.textContent = "View and manage your career presence";
            statusMsg.style.color = "var(--text-muted)";
        }
    }

    function loadUserData(data) {
        document.getElementById("profileFullName").value = data.full_name || "";
        document.getElementById("profileEmail").value = data.email || "";
        // Details from JobSeekerProfile will be loaded by fetchFullProfile
    }

    async function fetchFullProfile(userId) {
        try {
            const res = await fetch(`${API_BASE_URL}/jobseeker-profile/user/${userId}`);
            if (res.ok) {
                const profile = await res.json();
                document.getElementById("profilePhone").value = profile.phone || "";
                document.getElementById("profileLocation").value = profile.location || "";
                document.getElementById("profileDesiredJob").value = profile.desired_job || "";
                document.getElementById("profileExperience").value = profile.experience || "";
                document.getElementById("profileSkills").value = profile.skills || "";
                // Store profile id for updates
                form.dataset.profileId = profile.id;
            }
        } catch (err) { console.error("Profile not found or error:", err); }
    }

    form.onsubmit = async (e) => {
        e.preventDefault();

        const userData = {
            full_name: document.getElementById("profileFullName").value
        };

        const profileData = {
            user_id: user.id,
            phone: document.getElementById("profilePhone").value,
            location: document.getElementById("profileLocation").value,
            desired_job: document.getElementById("profileDesiredJob").value,
            experience: parseInt(document.getElementById("profileExperience").value) || 0,
            skills: document.getElementById("profileSkills").value
        };

        try {
            // Update User
            const userRes = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            // Update or Create Profile
            const profileId = form.dataset.profileId;
            const method = profileId ? "PUT" : "POST";
            const url = profileId
                ? `${API_BASE_URL}/jobseeker-profile/${profileId}`
                : `${API_BASE_URL}/jobseeker-profile/`;

            const profRes = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData)
            });

            if (userRes.ok && profRes.ok) {
                const newUser = await userRes.json();
                localStorage.setItem("user", JSON.stringify(newUser));
                alert("Profile and details updated successfully!");
                enableEdit(false);
                location.reload();
            } else {
                alert("Failed to update profile details.");
            }
        } catch (err) { console.error(err); }
    };
});
