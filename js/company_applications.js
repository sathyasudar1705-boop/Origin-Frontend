document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== 'employer') {
        window.location.href = "user_login.html";
        return;
    }

    const BASE_URL = window.API_BASE_URL || "http://127.0.0.1:8000";

    // Get company from session or fetch from API as fallback
    let company = user.company || null;

    if (!company) {
        try {
            const res = await fetch(`${BASE_URL}/companies`);
            if (res.ok) {
                const companies = await res.json();
                company = companies.find(c => c.user_id === user.id) || null;
                if (company) {
                    user.company = company;
                    localStorage.setItem("user", JSON.stringify(user));
                }
            }
        } catch (e) {
            console.error("Failed to fetch company fallback:", e);
        }
    }

    if (!company) {
        window.location.href = "create_company.html";
        return;
    }

    document.getElementById("companyNameDisplay").textContent = company.company_name;

    // Set initials avatar or logo
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

    const filter = document.getElementById("statusFilter");
    filter.onchange = () => renderApplications(filter.value);

    // Initial fetch
    await fetchApplications(company.id);

    // Modal Close Logic
    const modal = document.getElementById("appDetailModal");
    const closeBtn = document.getElementById("closeDetailModal") || document.getElementById("closeAppBtn");
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    const closeAppBtn2 = document.getElementById("closeAppBtn");
    if (closeAppBtn2) closeAppBtn2.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };
});

let allApps = [];

async function fetchApplications(companyId, status = "all") {
    const container = document.getElementById("applicationsFullList");
    container.innerHTML = "<p style='padding: 40px; text-align: center;'>Synchronizing candidate records...</p>";

    try {
        const res = await fetch(`${API_BASE_URL}/applications/company/${companyId}`);
        if (res.ok) {
            allApps = await res.json();
            renderApplications(status);
        } else {
            container.innerHTML = "<p style='padding: 40px; text-align: center; color: #ff4d4f;'>Synchronization failure.</p>";
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='padding: 40px; text-align: center; color: #ff4d4f;'>System error.</p>";
    }
}

function renderApplications(statusFilter) {
    const container = document.getElementById("applicationsFullList");
    container.innerHTML = "";

    const filteredApps = statusFilter === "all"
        ? allApps
        : allApps.filter(a => a.status === statusFilter);

    if (filteredApps.length === 0) {
        container.innerHTML = `<div class="apps-empty-state"><p>No candidates found${statusFilter !== 'all' ? ' with status: <strong>' + statusFilter + '</strong>' : ''}.<br>Post a job to start receiving applications!</p></div>`;
        return;
    }

    // Sort by created_at descending (latest first)
    filteredApps.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Table header
    const header = document.createElement("div");
    header.className = "apps-table-header";
    header.innerHTML = `
        <div class="apps-th-avatar"></div>
        <div class="apps-th-name">Candidate</div>
        <div class="apps-th-role">Role Applied</div>
        <div class="apps-th-exp">Experience</div>
        <div class="apps-th-date">Date</div>
        <div class="apps-th-status">Status</div>
        <div class="apps-th-action"></div>
    `;
    container.appendChild(header);

    filteredApps.forEach(app => {
        const initials = app.full_name
            ? app.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : "?";
        const dateStr = app.created_at
            ? new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : "—";

        const card = document.createElement("div");
        card.className = "app-row-card";
        card.onclick = () => showAppDetail(app);

        const candidateUrl = `view_candidate.html?id=${app.user_id}`;
        let avatarHtml = `<div class="app-avatar" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.href='${candidateUrl}'">${initials}</div>`;
        if (app.candidate_profile_image) {
            const imgPath = app.candidate_profile_image.startsWith('http') ? app.candidate_profile_image : `${BASE_URL}${app.candidate_profile_image}`;
            avatarHtml = `<div class="app-avatar" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.href='${candidateUrl}'"><img src="${imgPath}" alt="${app.full_name || ''}" onerror="this.parentElement.innerHTML='${initials}'"></div>`;
        }

        card.innerHTML = `
            ${avatarHtml}
            <div class="app-candidate-info">
                <div class="app-candidate-name">${app.full_name || 'N/A'}</div>
                <div class="app-candidate-sub">${app.email || ''}</div>
            </div>
            <div class="app-col-role">${app.job_title || 'Direct Application'}</div>
            <div class="app-col-exp">${app.experience || '—'}</div>
            <div class="app-col-date">${dateStr}</div>
            <div class="app-col-status">
                <span class="status-badge status-${(app.status || 'applied').toLowerCase()}">${app.status || 'Applied'}</span>
            </div>
            <svg class="app-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        `;
        container.appendChild(card);
    });
}


function showAppDetail(app) {
    const modal = document.getElementById("appDetailModal");
    const initials = app.full_name ? app.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "?";

    let avatarHtml = `<div class="app-avatar" style="width: 60px; height: 60px; margin-bottom: 15px; border-radius: 12px; font-size: 24px;">${initials}</div>`;
    if (app.candidate_profile_image) {
        const imgPath = app.candidate_profile_image.startsWith('http') ? app.candidate_profile_image : `${API_BASE_URL}${app.candidate_profile_image}`;
        avatarHtml = `<div class="app-avatar" style="width: 60px; height: 60px; margin-bottom: 15px; border-radius: 12px; overflow: hidden;"><img src="${imgPath}" alt="${app.full_name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='${initials}'"></div>`;
    }

    const modalTop = document.querySelector("#appDetailModal .modal-top > div");
    if (modalTop) {
        modalTop.innerHTML = `
            ${avatarHtml}
            <h3 id="detailCandidateName">${app.full_name}</h3>
            <span id="detailStatusBadge" class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
        `;
    } else {
        document.getElementById("detailCandidateName").textContent = app.full_name;
        document.getElementById("detailStatusBadge").textContent = app.status;
        document.getElementById("detailStatusBadge").className = `status-badge status-${app.status.toLowerCase()}`;
    }

    document.getElementById("detailEmail").textContent = app.email;
    document.getElementById("detailPhone").textContent = app.phone;
    document.getElementById("detailLocation").textContent = app.current_location;
    document.getElementById("detailExperience").textContent = app.experience;
    document.getElementById("detailSalary").textContent = app.expected_salary;
    document.getElementById("detailJobTitle").textContent = app.job_title || 'Direct Application';
    document.getElementById("detailSkills").textContent = app.skills || 'Not specified';
    document.getElementById("detailResume").href = app.resume_url;

    const shortlistBtn = document.getElementById("shortlistBtn");
    const selectBtn = document.getElementById("selectBtn");
    const rejectBtn = document.getElementById("rejectBtn");
    const modalActions = document.getElementById("modalActions");

    // Reset all buttons
    shortlistBtn.style.display = "none";
    selectBtn.style.display = "none";
    rejectBtn.style.display = "none";

    if (app.status === "Applied") {
        // Can shortlist or reject
        modalActions.style.display = "flex";
        shortlistBtn.style.display = "inline-flex";
        rejectBtn.style.display = "inline-flex";
        shortlistBtn.onclick = () => updateStatus(app.id, "Shortlisted");
        rejectBtn.onclick = () => updateStatus(app.id, "Cancelled");

    } else if (app.status === "Shortlisted") {
        // Can select or reject
        modalActions.style.display = "flex";
        selectBtn.style.display = "inline-flex";
        rejectBtn.style.display = "inline-flex";
        selectBtn.onclick = () => updateStatus(app.id, "Selected");
        rejectBtn.onclick = () => updateStatus(app.id, "Cancelled");

    } else {
        // Selected or Cancelled — no further actions
        modalActions.style.display = "none";
    }

    modal.style.display = "flex";
}

async function updateStatus(appId, newStatus) {
    const label = newStatus === "Cancelled" ? "Reject" : newStatus;
    if (!confirm(`Update candidate to "${label}"?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/applications/${appId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            alert(`Status updated to ${newStatus === "Cancelled" ? "Rejected" : newStatus} successfully.`);
            document.getElementById("appDetailModal").style.display = "none";
            location.reload();
        } else {
            alert("Failed to update status. Please try again.");
        }
    } catch (err) {
        console.error(err);
        alert("System error. Please try again.");
    }
}
