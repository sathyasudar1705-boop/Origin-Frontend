document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== 'employer') {
        window.location.href = "company_login.html";
        return;
    }

    const company = user.company;
    if (!company) {
        alert("Company details not found.");
        window.location.href = "company_dashboard.html";
        return;
    }

    const form = document.getElementById("companyProfileForm");
    const editBtn = document.getElementById("editToggleBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const formActions = document.getElementById("formActions");

    // Profile Photo Elements
    const profileUpload = document.getElementById("profileUpload");
    const profileImagePreview = document.getElementById("profileImagePreview");
    const navProfilePic = document.getElementById("navProfilePic");
    const avatarOverlay = document.getElementById("avatarOverlay");
    const uploadControls = document.getElementById("uploadControls");

    // Load initial data
    loadCompanyData(company);

    editBtn.onclick = () => enableEdit(true);
    cancelBtn.onclick = () => {
        enableEdit(false);
        loadCompanyData(company);
        // Reset preview if cancelled
        if (company.logo_url) {
            profileImagePreview.src = company.logo_url;
        } else {
            profileImagePreview.src = "../assets/default-company-logo.png";
        }
    };

    // Profile Photo Upload Preview
    profileUpload.addEventListener('change', function (e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profileImagePreview.src = e.target.result;
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Make avatar clickable in edit mode
    avatarOverlay.addEventListener('click', () => {
        if (!form.classList.contains('view-mode')) {
            profileUpload.click();
        }
    });

    function loadCompanyData(comp) {
        document.getElementById("displayCompName").textContent = comp.company_name;
        document.getElementById("displayCompIndustry").textContent = comp.industry || "Industry Not Set";

        // Update header company name
        const headerCompName = document.getElementById("companyNameDisplay");
        if (headerCompName) headerCompName.textContent = comp.company_name;

        document.getElementById("compName").value = comp.company_name;
        document.getElementById("compEmail").value = comp.email || user.email;
        document.getElementById("compIndustry").value = comp.industry || "";
        document.getElementById("compWebsite").value = comp.website || "";
        document.getElementById("compLocation").value = comp.location || "";
        document.getElementById("compPhone").value = comp.phone || "";
        document.getElementById("compDesc").value = comp.description || "";

        // Load Logo if exists
        if (comp.logo_url) {
            profileImagePreview.src = comp.logo_url;
            // Update nav bar profile pic if we had a way to display it there
            if (navProfilePic) {
                navProfilePic.style.backgroundImage = `url('${comp.logo_url}')`;
            }
        }

        updateProgress(comp);
    }

    function enableEdit(isEditing) {
        if (isEditing) {
            form.classList.remove("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => {
                if (el.id !== "compEmail") el.removeAttribute("readonly");
            });
            editBtn.style.display = "none";
            formActions.style.display = "flex";
            avatarOverlay.style.display = "flex";
            uploadControls.style.display = "block";
        } else {
            form.classList.add("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => el.setAttribute("readonly", true));
            editBtn.style.display = "block";
            formActions.style.display = "none";
            avatarOverlay.style.display = "none";
            uploadControls.style.display = "none";
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault();

        const updatedData = {
            company_name: document.getElementById("compName").value,
            industry: document.getElementById("compIndustry").value,
            website: document.getElementById("compWebsite").value,
            location: document.getElementById("compLocation").value,
            phone: document.getElementById("compPhone").value,
            description: document.getElementById("compDesc").value
        };

        if (!company.id) {
            alert("Session error: Company ID missing. Please log out and log back in.");
            return;
        }

        try {
            console.log("Updating company profile. ID:", company.id);

            // 1. Upload Logo if selected
            if (profileUpload.files && profileUpload.files[0]) {
                const formData = new FormData();
                formData.append("file", profileUpload.files[0]);

                try {
                    console.log("Uploading logo...");
                    const uploadRes = await fetch(`${API_BASE_URL}/companies/${company.id}/logo`, {
                        method: "POST",
                        body: formData
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        updatedData.logo_url = uploadData.logo_url;
                        console.log("Logo uploaded successfully:", uploadData.logo_url);
                    } else {
                        console.error("Logo upload failed");
                        let errText = await uploadRes.text();
                        console.error("Upload error details:", errText);
                    }
                } catch (uploadErr) {
                    console.error("Logo upload network error:", uploadErr);
                }
            }

            // 2. Update Text Data
            console.log("Saving text data:", updatedData);
            const res = await fetch(`${API_BASE_URL}/companies/${company.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                const updatedComp = await res.json();

                // Merge old user data with new company data
                user.company = updatedComp;

                localStorage.setItem("user", JSON.stringify(user));
                alert("Company profile updated successfully!");
                location.reload();
            } else {
                let errorMsg = "Unknown error";
                try {
                    const error = await res.json();
                    errorMsg = error.detail || JSON.stringify(error);
                } catch (e) {
                    errorMsg = await res.text();
                }
                console.error("API Error:", errorMsg);
                alert("Update failed: " + errorMsg);
            }
        } catch (err) {
            console.error("Fetch/Script Error:", err);
            alert("Connection error: " + err.message);
        }
    };

    function updateProgress(comp) {
        let fields = ['company_name', 'industry', 'website', 'location', 'phone', 'description'];
        let completed = fields.filter(f => comp[f] && comp[f].length > 0).length;
        // Add logo to progress if it exists
        if (comp.logo_url) completed++;

        let total = fields.length + 1; // +1 for logo
        let percentage = Math.round((completed / total) * 100);
        document.getElementById("profileProgress").style.width = percentage + "%";
    }
});
