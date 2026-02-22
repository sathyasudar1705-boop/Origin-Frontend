document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== 'employer') {
        window.location.href = "company_login.html";
        return;
    }

    const BASE_URL = window.API_BASE_URL || "http://127.0.0.1:8000";

    // Always fetch fresh company data from API (not from stale localStorage)
    let company = null;

    try {
        const res = await fetch(`${BASE_URL}/companies`);
        if (res.ok) {
            const companies = await res.json();
            company = companies.find(c => c.user_id === user.id) || null;
            if (company) {
                // Keep localStorage in sync with fresh data
                user.company = company;
                localStorage.setItem("user", JSON.stringify(user));
            }
        }
    } catch (e) {
        console.error("Failed to fetch company data:", e);
        // Fallback to localStorage if network fails
        company = user.company || null;
    }

    if (!company) {
        window.location.href = "create_company.html";
        return;
    }

    // ---- DOM refs ----
    const form = document.getElementById("companyProfileForm");
    const editBtn = document.getElementById("editToggleBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const formActions = document.getElementById("formActions");
    const profileUpload = document.getElementById("profileUpload");
    const logoPreview = document.getElementById("profileImagePreview");
    const logoChangeTrig = document.getElementById("logoChangeTrigger");
    const saveBtn = document.getElementById("saveBtn");

    // Update company name and avatar in header
    const companyNameDisplay = document.getElementById("companyNameDisplay");
    if (companyNameDisplay) companyNameDisplay.textContent = company.company_name;

    const avatar = document.getElementById("companyInitialsAvatar");
    if (avatar && company) {
        const initials = company.company_name ? company.company_name.charAt(0).toUpperCase() : "C";
        const logoUrl = company.logo_url || company.logo;
        if (logoUrl) {
            const finalLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${BASE_URL}${logoUrl}`;
            avatar.innerHTML = `<img src="${finalLogoUrl}" alt="${company.company_name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='${initials}'">`;
        } else {
            avatar.textContent = initials;
        }
    }

    // Load data initially
    loadCompanyData(company);


    // ---- Edit / Cancel ----
    editBtn.onclick = () => enableEdit(true);

    cancelBtn.onclick = () => {
        enableEdit(false);
        loadCompanyData(company);
        // Reset logo preview if cancelled without saving
        const logoUrl = company.logo_url || company.logo;
        if (logoUrl) logoPreview.src = logoUrl;
    };

    // ---- Logo Upload Preview ----
    profileUpload.addEventListener("change", function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => { logoPreview.src = e.target.result; };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // ---- Load Data into Form ----
    function loadCompanyData(comp) {
        document.getElementById("displayCompName").textContent = comp.company_name || "—";
        document.getElementById("displayCompIndustry").textContent = comp.industry || "Industry not set";

        document.getElementById("compName").value = comp.company_name || "";
        document.getElementById("compEmail").value = comp.email || user.email || "";
        document.getElementById("compIndustry").value = comp.industry || "";
        document.getElementById("compWebsite").value = comp.website || "";
        document.getElementById("compLocation").value = comp.location || "";
        document.getElementById("compPhone").value = comp.phone || "";
        document.getElementById("compDesc").value = comp.description || "";

        // Load logo
        const logoUrl = comp.logo_url || comp.logo;
        if (logoUrl) logoPreview.src = logoUrl;

        updateProgress(comp);
    }

    // ---- Enable / Disable Edit Mode ----
    function enableEdit(isEditing) {
        if (isEditing) {
            form.classList.remove("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => {
                if (el.id !== "compEmail") el.removeAttribute("readonly");
            });
            editBtn.style.display = "none";
            formActions.style.display = "flex";
            if (logoChangeTrig) logoChangeTrig.classList.add("visible");
        } else {
            form.classList.add("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => el.setAttribute("readonly", true));
            editBtn.style.display = "flex";
            formActions.style.display = "none";
            if (logoChangeTrig) logoChangeTrig.classList.remove("visible");
        }
    }

    // ---- Form Submit (PUT to backend) ----
    form.onsubmit = async (e) => {
        e.preventDefault();

        const updatedData = {
            company_name: document.getElementById("compName").value.trim(),
            industry: document.getElementById("compIndustry").value.trim(),
            website: document.getElementById("compWebsite").value.trim(),
            location: document.getElementById("compLocation").value.trim(),
            phone: document.getElementById("compPhone").value.trim(),
            description: document.getElementById("compDesc").value.trim()
        };

        if (!company.id) {
            showToast("❌ Session error: Company ID missing.", true);
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        try {
            // 1. Upload Logo if new one selected
            if (profileUpload.files && profileUpload.files[0]) {
                try {
                    if (typeof uploadImage === "function") {
                        const imageUrl = await uploadImage(profileUpload.files[0], "company");
                        updatedData.logo_url = imageUrl;
                        updatedData.logo = imageUrl;
                    }
                } catch (uploadErr) {
                    console.error("Logo upload error:", uploadErr);
                    showToast("⚠️ Logo upload failed. Saving other changes...", true);
                }
            }

            // 2. Update company data via PUT
            const res = await fetch(`${BASE_URL}/companies/${company.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                const updatedComp = await res.json();
                console.log("Company update response:", updatedComp);

                // Ensure logo data is preserved from either source
                const logo = updatedComp.logo || updatedComp.logo_url || company.logo || company.logo_url;

                // Merge update back into session
                company = { ...company, ...updatedComp, logo: logo, logo_url: logo };
                user.company = company;
                localStorage.setItem("user", JSON.stringify(user));

                // Update display names without full reload
                loadCompanyData(company);
                if (companyNameDisplay) companyNameDisplay.textContent = company.company_name;
                enableEdit(false);
                showToast("✅ Profile updated successfully!");
            } else {
                const err = await res.json().catch(() => ({}));
                showToast("❌ " + (err.detail || "Update failed. Please try again."), true);
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Changes";
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Network error. Please check your connection.", true);
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
        }
    };

    // ---- Profile Completion Progress ----
    function updateProgress(comp) {
        const fields = ["company_name", "industry", "website", "location", "phone", "description"];
        let completed = fields.filter(f => comp[f] && comp[f].length > 0).length;
        if (comp.logo_url || comp.logo) completed++;
        const total = fields.length + 1;
        const pct = Math.round((completed / total) * 100);
        document.getElementById("profileProgress").style.width = pct + "%";
        document.getElementById("progressLabel").textContent = pct + "% Complete";
    }

    // ---- Toast Helper ----
    function showToast(msg, isError = false) {
        const toast = document.getElementById("profileToast");
        const msgEl = document.getElementById("toastMsg");
        if (!toast || !msgEl) { alert(msg); return; }
        msgEl.textContent = msg;
        toast.style.background = isError ? "#ef4444" : "#1b2559";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3500);
    }

    // ---- Account Deletion Logic ----
    const deleteBtn = document.getElementById("deleteCompanyBtn");
    const deleteModal = document.getElementById("deleteCompanyModal");
    const closeBtn = document.getElementById("closeDeleteModal");
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
            alert("Please enter your password to confirm.");
            return;
        }

        try {
            confirmDeleteBtn.textContent = "Deleting Brand...";
            confirmDeleteBtn.disabled = true;

            const res = await fetch(`${BASE_URL}/companies/${company.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: password })
            });

            if (res.ok) {
                alert("Company and associated account deleted successfully.");
                localStorage.clear();
                window.location.href = "../index.html";
            } else {
                const err = await res.json();
                alert(err.detail || "Deletion failed. Please check your password.");
                confirmDeleteBtn.textContent = "Delete Permanently";
                confirmDeleteBtn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred. Please try again.");
            confirmDeleteBtn.textContent = "Delete Permanently";
            confirmDeleteBtn.disabled = false;
        }
    };
});
