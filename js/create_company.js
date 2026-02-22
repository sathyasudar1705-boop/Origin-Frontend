document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== 'employer') {
        window.location.href = "company_login.html";
        return;
    }
    if (user.company && user.company.company_name) {
        document.getElementById("welcomeTitle").textContent = `Setup ${user.company.company_name}`;
    }

    const form = document.getElementById("setupCompanyForm");
    const submitBtn = document.getElementById("submitBtn");

    form.onsubmit = async (e) => {
        e.preventDefault();

        const companyId = user.company.id;
        const data = {
            industry: document.getElementById("compIndustry").value,
            website: document.getElementById("compWebsite").value,
            phone: document.getElementById("compPhone").value,
            description: document.getElementById("compDesc").value
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Processing Identity...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const updatedComp = await response.json();
                // Update local user object
                user.company = { ...user.company, ...updatedComp };
                localStorage.setItem("user", JSON.stringify(user));

                alert("Corporate profile successfully established!");
                window.location.href = "company_dashboard.html";
            } else {
                alert("Failed to synchronize business profile.");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Finalize Corporate Profile";
                }
            }
        } catch (err) {
            console.error(err);
            alert("System error during setup.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Finalize Corporate Profile";
            }
        }
    };
});
