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
            const res = await fetch(`${BASE_URL}/companies?user_id=${user.id}`);
            if (res.ok) {
                const companies = await res.json();
                // Find this user's company
                company = companies.find(c => c.user_id === user.id) || companies[0] || null;
                if (company) {
                    // Save it back to session for next time
                    user.company = company;
                    localStorage.setItem("user", JSON.stringify(user));
                }
            }
        } catch (e) {
            console.error("Failed to fetch company fallback:", e);
        }
    }

    if (!company) {
        // Company doesn't exist yet, redirect to create it
        window.location.href = "create_company.html";
        return;
    }

    document.getElementById("welcomeMsg").textContent = `Welcome, ${user.full_name} 👋`;
    const sub = document.getElementById("companySubtitle");
    if (sub) sub.textContent = company.company_name || "Employer Hub";
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

    // Modal logic
    const modal = document.getElementById("postJobModal");
    const openBtn = document.getElementById("openPostModal");
    const postJobNav = document.getElementById("postJobNav");
    const closeBtn = document.getElementById("closeModal");
    let editingJobId = null;

    const openModal = () => {
        editingJobId = null;
        postForm.reset();
        document.querySelector("#postJobModal h3").textContent = "Post a New Job";
        modal.style.display = "flex";
    };

    openBtn.onclick = openModal;
    if (postJobNav) postJobNav.onclick = (e) => { e.preventDefault(); openModal(); };
    closeBtn.onclick = () => modal.style.display = "none";
    const cancelPostBtn = document.getElementById("cancelPostBtn");
    if (cancelPostBtn) cancelPostBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

    // Post/Edit Job Form
    const postForm = document.getElementById("postJobForm");
    postForm.onsubmit = async (e) => {
        e.preventDefault();
        const jobType = document.getElementById("jobType").value;
        const data = {
            company_id: company.id,
            title: document.getElementById("jobTitle").value,
            location: document.getElementById("jobLocation").value,
            salary: document.getElementById("jobSalary").value,
            description: document.getElementById("jobDesc").value
        };

        if (jobType === "full-time") {
            data.skills_required = document.getElementById("jobSkills").value;
        } else {
            data.skills = document.getElementById("jobSkills").value;
        }

        let endpoint = jobType === "full-time" ? "/jobs/" : "/part_time_jobs/";
        let method = "POST";

        if (editingJobId) {
            endpoint += editingJobId;
            method = "PUT";
        }

        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                alert(`✅ Success! Job ${editingJobId ? 'updated' : 'posted'}.`);
                modal.style.display = "none";
                location.reload();
            } else {
                const error = await res.json();
                alert("Error: " + (error.detail || "Action failed"));
            }
        } catch (err) { console.error(err); }
    };

    window.openEditModal = (e, job, type) => {
        e.stopPropagation(); // Prevent triggering the card click
        editingJobId = job.id;
        document.getElementById("jobType").value = type;
        document.getElementById("jobTitle").value = job.title;
        document.getElementById("jobLocation").value = job.location;
        document.getElementById("jobSalary").value = job.salary;
        document.getElementById("jobDesc").value = job.description;
        document.getElementById("jobSkills").value = type === 'full-time' ? job.skills_required : (job.skills || "");

        document.querySelector("#postJobModal h3").textContent = "Update Job Listing";
        modal.style.display = "flex";
    };

    // Job Details Modal Logic
    const detailsModal = document.getElementById("jobDetailsModal");
    const closeDetailBtn = document.getElementById("closeDetailModal");

    window.openJobDetails = (job) => {
        document.getElementById("detailJobTitle").textContent = job.title;
        document.getElementById("detailJobType").textContent = job.is_part_time ? "Part-time" : "Full-time"; // Assuming logic or pass type
        document.getElementById("detailJobType").className = `job-type-pill ${job.is_part_time ? 'part-time' : 'full-time'}`;
        document.getElementById("detailJobLocation").textContent = job.location;
        document.getElementById("detailJobSalary").textContent = job.salary || "Not specified";
        document.getElementById("detailJobDesc").textContent = job.description || "No description provided.";
        document.getElementById("detailJobSkills").textContent = job.skills_required || job.skills || "None listed";

        detailsModal.style.display = "flex";
    };

    closeDetailBtn.onclick = () => detailsModal.style.display = "none";
    window.onclick = (e) => {
        if (e.target == modal) modal.style.display = "none";
        if (e.target == detailsModal) detailsModal.style.display = "none";
    };

    // Load Company Data
    await fetchCompanyData(company.id);
});

async function fetchCompanyData(companyId) {
    try {
        // Full-time Jobs
        const jobsRes = await fetch(`${API_BASE_URL}/jobs/`);
        if (jobsRes.ok) {
            const allJobs = await jobsRes.json();
            const myJobs = allJobs.filter(j => j.company && j.company.id === companyId);
            const statJobsEl = document.getElementById("statTotalJobs");
            if (statJobsEl) { statJobsEl.textContent = myJobs.length; statJobsEl.dataset.ftCount = myJobs.length; }

            const container = document.getElementById("employerJobs");
            container.innerHTML = "";
            if (myJobs.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No full-time jobs posted yet.</p></div>';
            } else {
                myJobs.forEach(job => {
                    const item = document.createElement("div");
                    item.className = "job-listing-card";
                    item.onclick = () => openJobDetails(job);
                    item.innerHTML = `
                        <div class="job-listing-info">
                            <h4>${job.title}</h4>
                            <p>${job.location} &bull; ${job.salary || 'Competitive'}</p>
                        </div>
                        <div class="job-listing-actions">
                            <span class="job-type-pill full-time">Full-time</span>
                            <button class="btn-icon-action" onclick='openEditModal(event, ${JSON.stringify(job)}, "full-time")' title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button class="btn-icon-action" style="border-color:#fecaca; color:#ef4444;" onclick='deleteJob(event, ${job.id}, "full-time")' title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    `;
                    container.appendChild(item);
                });
            }
        }

        // Part-time Jobs
        const ptJobsRes = await fetch(`${API_BASE_URL}/part_time_jobs/`);
        if (ptJobsRes.ok) {
            const allPTJobs = await ptJobsRes.json();
            const myPTJobs = allPTJobs.filter(j => j.company_id === companyId);

            const container = document.getElementById("employerPTJobs");
            container.innerHTML = "";
            if (myPTJobs.length === 0) container.innerHTML = "<p style='color:#999;font-size:13px;'>No part-time jobs posted.</p>";

            myPTJobs.forEach(job => {
                const item = document.createElement("div");
                item.className = "job-listing-card";
                job.is_part_time = true;
                item.onclick = () => openJobDetails(job);
                item.innerHTML = `
                    <div class="job-listing-info">
                        <h4>${job.title}</h4>
                        <p>${job.location} &bull; ${job.salary || 'Competitive'}</p>
                    </div>
                    <div class="job-listing-actions">
                        <span class="job-type-pill part-time">Part-time</span>
                        <button class="btn-icon-action" onclick='openEditModal(event, ${JSON.stringify(job)}, "part-time")' title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button class="btn-icon-action" style="border-color:#fecaca; color:#ef4444;" onclick='deleteJob(event, ${job.id}, "part-time")' title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });

            const totalJobsStat = document.getElementById("statTotalJobs");
            if (totalJobsStat) {
                const ftCount = parseInt(document.getElementById("statTotalJobs")?.dataset.ftCount || 0);
                totalJobsStat.textContent = ftCount + myPTJobs.length;
            }
        }

        // Applications (Recent)
        const appsRes = await fetch(`${API_BASE_URL}/applications/company/${companyId}`);
        if (appsRes.ok) {
            const apps = await appsRes.json();
            const statTotalAppsEl = document.getElementById("statTotalApplications");
            if (statTotalAppsEl) statTotalAppsEl.textContent = apps.length;

            // Count shortlisted
            const shortlisted = apps.filter(a => a.status === 'Approved' || a.status === 'Shortlisted').length;
            const statSelectedEl = document.getElementById("statSelected");
            if (statSelectedEl) statSelectedEl.textContent = shortlisted;

            const container = document.getElementById("companyApplications");
            container.innerHTML = "";

            if (apps.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No applications received yet.<br>Post a job to start receiving candidates!</p></div>';
            } else {
                const recentApps = apps
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                    .slice(0, 8);

                recentApps.forEach(app => {
                    const initials = app.full_name ? app.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
                    const item = document.createElement("div");
                    item.className = "candidate-card";
                    item.onclick = () => showAppDetail(app);

                    const candidateUrl = `view_candidate.html?id=${app.user_id}`;
                    let avatarHtml = `<div class="candidate-avatar" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.href='${candidateUrl}'">${initials}</div>`;
                    if (app.candidate_profile_image) {
                        const imgPath = app.candidate_profile_image.startsWith('http') ? app.candidate_profile_image : `${BASE_URL}${app.candidate_profile_image}`;
                        avatarHtml = `<div class="candidate-avatar" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.href='${candidateUrl}'"><img src="${imgPath}" alt="${app.full_name || ''}" onerror="this.parentElement.innerHTML='${initials}'"></div>`;
                    }

                    item.innerHTML = `
                        ${avatarHtml}
                        <div class="candidate-details">
                            <h4>${app.full_name || 'N/A'}</h4>
                            <p>${app.job_title || 'No role specified'}</p>
                        </div>
                        <span class="status-badge status-${(app.status || 'applied').toLowerCase()}">${app.status || 'Applied'}</span>
                    `;
                    container.appendChild(item);
                });
            }
        }
    } catch (err) { console.error(err); }
}

function showAppDetail(app) {
    const modal = document.getElementById("appDetailModal");
    const initials = app.full_name ? app.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';

    let avatarHtml = `<div class="candidate-avatar" style="width: 60px; height: 60px; margin-bottom: 15px; border-radius: 12px; font-size: 24px;">${initials}</div>`;
    if (app.candidate_profile_image) {
        const imgPath = app.candidate_profile_image.startsWith('http') ? app.candidate_profile_image : `${API_BASE_URL}${app.candidate_profile_image}`;
        avatarHtml = `<div class="candidate-avatar" style="width: 60px; height: 60px; margin-bottom: 15px; border-radius: 12px; overflow: hidden;"><img src="${imgPath}" alt="${app.full_name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='${initials}'"></div>`;
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
    const appliedJobTitleEl = document.getElementById("detailAppliedJobTitle") || document.getElementById("detailJobTitle");
    if (appliedJobTitleEl) appliedJobTitleEl.textContent = app.job_title || 'N/A';
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

    // Close logic
    const closeAppBtn = document.getElementById("closeAppDetailModal") || document.getElementById("closeCandidateModal");
    if (closeAppBtn) closeAppBtn.onclick = () => modal.style.display = "none";
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
            location.reload();
        } else {
            alert("Update failed.");
        }
    } catch (err) {
        console.error(err);
        alert("Action error.");
    }
}

async function deleteJob(e, jobId, type) {
    e.stopPropagation(); // Prevent card click
    if (!confirm(`Are you sure you want to delete this ${type} job listing? This action cannot be undone.`)) return;

    let endpoint = type === "full-time" ? "/jobs/" : "/part_time_jobs/";
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}${jobId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("✅ Job deleted successfully!");
            location.reload();
        } else {
            const error = await res.json();
            alert("Error: " + (error.detail || "Failed to delete job"));
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
    }
}

// Make globally accessible if needed
window.updateAppStatus = updateStatus;
window.deleteJob = deleteJob;
// Mobile Sidebar Toggle
window.toggleSidebar = function () {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
};

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (sidebar && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});
