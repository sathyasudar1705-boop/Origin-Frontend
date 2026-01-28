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
    const statusMsg = document.getElementById("profileStatus");

    // Load initial data
    loadCompanyData(company);

    editBtn.onclick = () => enableEdit(true);
    cancelBtn.onclick = () => {
        enableEdit(false);
        loadCompanyData(company);
    };

    function loadCompanyData(comp) {
        document.getElementById("displayCompName").textContent = comp.company_name;
        document.getElementById("compName").value = comp.company_name;
        document.getElementById("compEmail").value = comp.email || user.email;
        document.getElementById("compIndustry").value = comp.industry || "";
        document.getElementById("compWebsite").value = comp.website || "";
        document.getElementById("compLocation").value = comp.location || "";
        document.getElementById("compPhone").value = comp.phone || "";
        document.getElementById("compDesc").value = comp.description || "";

        updateProgress(comp);
    }

    function enableEdit(isEditing) {
        if (isEditing) {
            form.classList.remove("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => {
                if (el.id !== "compEmail") el.removeAttribute("readonly");
            });
            editBtn.style.display = "none";
            statusMsg.textContent = "Updating your business presence...";
            statusMsg.style.color = "var(--primary-blue)";
        } else {
            form.classList.add("view-mode");
            form.querySelectorAll("input, textarea").forEach(el => el.setAttribute("readonly", true));
            editBtn.style.display = "block";
            statusMsg.textContent = "Manage your business brand and contact details";
            statusMsg.style.color = "var(--text-muted)";
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
            console.error("Company object in localStorage is missing ID:", company);
            return;
        }

        try {
            console.log("Updating company profile. ID:", company.id, "Data:", updatedData);
            const res = await fetch(`${API_BASE_URL}/companies/${company.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                const updatedComp = await res.json();
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
            alert("Connection error or script crash. Please check if the server is running.\nError: " + err.message);
        }
    };

    function updateProgress(comp) {
        let fields = ['company_name', 'industry', 'website', 'location', 'phone', 'description'];
        let completed = fields.filter(f => comp[f] && comp[f].length > 0).length;
        let percentage = Math.round((completed / fields.length) * 100);
        document.getElementById("profileProgress").style.width = percentage + "%";
    }
});
