document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== 'employer') {
        window.location.href = "user_login.html";
        return;
    }

    const company = user.company;
    if (!company) {
        alert("Company details not found.");
        return;
    }

    document.getElementById("companyNameDisplay").textContent = company.company_name;

    const filter = document.getElementById("statusFilter");
    filter.onchange = () => fetchApplications(company.id, filter.value);

    // Initial fetch
    await fetchApplications(company.id);

    // Modal Close Logic
    const modal = document.getElementById("appDetailModal");
    const closeBtn = document.getElementById("closeDetailModal");
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };
});

let allApps = [];

async function fetchApplications(companyId, status = "all") {
    const container = document.getElementById("applicationsFullList");
    container.innerHTML = "<p>Loading applications...</p>";

    try {
        const res = await fetch(`${API_BASE_URL}/applications/company/${companyId}`);
        if (res.ok) {
            allApps = await res.json();
            renderApplications(status);
        } else {
            container.innerHTML = "<p>Error loading data.</p>";
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Server error.</p>";
    }
}

function renderApplications(statusFilter) {
    const container = document.getElementById("applicationsFullList");
    container.innerHTML = "";

    const filteredApps = statusFilter === "all"
        ? allApps
        : allApps.filter(a => a.status === statusFilter);

    if (filteredApps.length === 0) {
        container.innerHTML = `<p style="padding: 20px; color: var(--text-secondary);">No applications found ${statusFilter !== 'all' ? 'with status: ' + statusFilter : ''}.</p>`;
        return;
    }

    // Sort by created_at descending (latest first)
    filteredApps.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    filteredApps.forEach(app => {
        const initials = app.full_name ? app.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : "??";
        const card = document.createElement("div");
        card.className = "app-item";
        card.style.cursor = "pointer";
        card.onclick = () => showAppDetail(app);

        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; flex:1;">
                <div class="app-avatar">${initials}</div>
                <div class="app-details">
                    <h4 style="margin:0;">${app.full_name}</h4>
                    <p style="margin:2px 0; font-size:13px; color:var(--text-secondary);">Applied for: ${app.job_title || 'N/A'}</p>
                    <p style="margin:0; font-size:11px; opacity:0.8;">${app.email} • ${app.created_at || ''}</p>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
                <button class="btn-edit" style="padding: 6px 12px; font-size: 11px;">View Details</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function showAppDetail(app) {
    const modal = document.getElementById("appDetailModal");
    document.getElementById("detailCandidateName").textContent = app.full_name;
    document.getElementById("detailStatusBadge").textContent = app.status;
    document.getElementById("detailStatusBadge").className = `status-badge status-${app.status.toLowerCase()}`;

    document.getElementById("detailEmail").textContent = app.email;
    document.getElementById("detailPhone").textContent = app.phone;
    document.getElementById("detailLocation").textContent = app.current_location;
    document.getElementById("detailExperience").textContent = app.experience;
    document.getElementById("detailSalary").textContent = app.expected_salary;
    document.getElementById("detailJobTitle").textContent = app.job_title || 'N/A';
    document.getElementById("detailSkills").textContent = app.skills;
    document.getElementById("detailResume").href = app.resume_url;

    const approveBtn = document.getElementById("approveBtn");
    const rejectBtn = document.getElementById("rejectBtn");

    if (app.status === "Applied") {
        approveBtn.style.display = "block";
        rejectBtn.style.display = "block";
        approveBtn.onclick = () => updateStatus(app.id, "Approved");
        rejectBtn.onclick = () => updateStatus(app.id, "Rejected");
    } else {
        approveBtn.style.display = "none";
        rejectBtn.style.display = "none";
    }

    modal.style.display = "flex";
}

async function updateStatus(appId, newStatus) {
    if (!confirm(`Set this application to ${newStatus}?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/applications/${appId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            alert(`Application ${newStatus}!`);
            document.getElementById("appDetailModal").style.display = "none";
            location.reload(); // Refresh to update list
        } else {
            alert("Update failed.");
        }
    } catch (err) {
        console.error(err);
        alert("Action error.");
    }
}
