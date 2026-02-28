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
    const topNavPic = document.getElementById("topNavProfilePic");

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

    picInput.addEventListener("change", async function (event) {
        const file = event.target.files[0];
        if (file) {
            // Preview
            const reader = new FileReader();
            reader.onload = function (e) {
                profilePic.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Upload
            try {
                if (statusMsg) {
                    statusMsg.textContent = "Uploading new identity image...";
                    statusMsg.style.color = "var(--primary)";
                }

                const imageUrl = await uploadImage(file, "user");

                if (statusMsg) {
                    statusMsg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Identity image synchronized successfully!`;
                    statusMsg.style.color = "#01b574";
                }

                // Update UI and local storage
                profilePic.src = imageUrl;
                if (topNavPic) topNavPic.src = imageUrl;
                user.profile_image = imageUrl;
                localStorage.setItem("user", JSON.stringify(user));
            } catch (err) {
                console.error("Upload failed:", err);
                console.log("Upload failed: " + err.message);
                if (statusMsg) {
                    statusMsg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Synchronization failed`;
                    statusMsg.style.color = "#ff4d4f";
                }
            }
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
            statusMsg.style.color = "var(--primary)";
        } else {
            form.classList.add("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => el.setAttribute("readonly", true));
            editBtn.style.display = "block";
            statusMsg.textContent = "Manage your OriginX identity and expertise";
            statusMsg.style.color = "var(--text-secondary)";
        }
    }

    function loadUserData(data) {
        document.getElementById("profileFullName").value = data.full_name || "";
        document.getElementById("profileEmail").value = data.email || "";
        if (data.profile_image) {
            const picPath = data.profile_image.startsWith('http') ? data.profile_image : `${API_BASE_URL}${data.profile_image}`;
            document.getElementById("profilePic").src = picPath;
            if (topNavPic) topNavPic.src = picPath;
        }
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
                console.log("Profile and details updated successfully!");
                enableEdit(false);
                location.reload();
            } else {
                console.log("Failed to update profile details.");
            }
        } catch (err) { console.error(err); }
    };

    // Account Deletion Logic
    const deleteBtn = document.getElementById("deleteAccountBtn");
    const deleteModal = document.getElementById("deleteAccountModal");
    const closeBtn = document.querySelector(".close-modal-btn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    if (deleteBtn) {
        deleteBtn.onclick = () => deleteModal.style.display = "flex";
    }

    if (closeBtn) closeBtn.onclick = () => deleteModal.style.display = "none";
    if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => deleteModal.style.display = "none";

    confirmDeleteBtn.onclick = async () => {
        const password = document.getElementById("deleteConfirmPassword").value;
        if (!password) {
            console.log("Please enter your password to confirm.");
            return;
        }

        try {
            confirmDeleteBtn.textContent = "Deleting...";
            confirmDeleteBtn.disabled = true;

            const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: password })
            });

            if (res.ok) {
                console.log("Account deleted successfully. We're sorry to see you go!");
                localStorage.clear();
                window.location.href = "../index.html";
            } else {
                const err = await res.json();
                console.log(err.detail || "Deletion failed. Please check your password.");
                confirmDeleteBtn.textContent = "Permanently Delete";
                confirmDeleteBtn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            console.log("An error occurred. Please try again later.");
            confirmDeleteBtn.textContent = "Permanently Delete";
            confirmDeleteBtn.disabled = false;
        }
    };
});
