document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== 'employer') {
        window.location.href = "user_login.html";
        return;
    }

    const company = user.company;
    if (!company) {
        alert("Company details not found. Please contact support.");
        return;
    }

    document.getElementById("companyNameDisplay").textContent = company.company_name;
    document.getElementById("welcomeMsg").textContent = `Welcome, ${user.full_name}`;

    // Modal logic
    const modal = document.getElementById("postJobModal");
    const openBtn = document.getElementById("openPostModal");
    const closeBtn = document.getElementById("closeModal");
    let editingJobId = null;

    openBtn.onclick = () => {
        editingJobId = null;
        postForm.reset();
        document.querySelector("#postJobModal h3").textContent = "Post a New Job";
        modal.style.display = "flex";
    };
    closeBtn.onclick = () => modal.style.display = "none";
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

    window.openEditModal = (job, type) => {
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
            document.getElementById("statJobs").textContent = myJobs.length;

            const container = document.getElementById("employerJobs");
            container.innerHTML = "";
            myJobs.forEach(job => {
                const item = document.createElement("div");
                item.className = "job-card";
                item.innerHTML = `
                    <div style="flex:1;">
                        <span class="job-type-pill pill-ft">Full-time</span>
                        <h4 style="margin:10px 0 5px;">${job.title}</h4>
                        <p style="margin:0; font-size:13px; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${job.location} | 💰 ${job.salary || 'N/A'}
                        </p>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-edit" onclick='openEditModal(${JSON.stringify(job)}, "full-time")'>Edit</button>
                        <button class="btn-delete" onclick='deleteJob(${job.id}, "full-time")'>Delete</button>
                    </div>
                `;
                container.appendChild(item);
            });
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
                item.className = "job-card";
                item.innerHTML = `
                    <div style="flex:1;">
                        <span class="job-type-pill pill-pt">Part-time</span>
                        <h4 style="margin:10px 0 5px;">${job.title}</h4>
                        <p style="margin:0; font-size:13px; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${job.location} | 💰 ${job.salary || 'N/A'}
                        </p>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-edit" onclick='openEditModal(${JSON.stringify(job)}, "part-time")'>Edit</button>
                        <button class="btn-delete" onclick='deleteJob(${job.id}, "part-time")'>Delete</button>
                    </div>
                `;
                container.appendChild(item);
            });

            // Total jobs stat update
            const totalJobs = parseInt(document.getElementById("statJobs").textContent) + myPTJobs.length;
            document.getElementById("statJobs").textContent = totalJobs;
        }

        // Applications (Recent)
        const appsRes = await fetch(`${API_BASE_URL}/applications/company/${companyId}`);
        if (appsRes.ok) {
            const apps = await appsRes.json();
            document.getElementById("statApps").textContent = apps.length;

            const container = document.getElementById("companyApplications");
            container.innerHTML = "";

            if (apps.length === 0) {
                container.innerHTML = "<p>No applications received yet.</p>";
            } else {
                // Sort by latest first and take top 5
                const recentApps = apps
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                    .slice(0, 5);

                recentApps.forEach(app => {
                    const initials = app.full_name ? app.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : "??";
                    const card = document.createElement("div");
                    card.className = "app-item";
                    card.style.cursor = "pointer";
                    card.onclick = () => showAppDetail(app);

                    card.innerHTML = `
                        <div class="app-avatar">${initials}</div>
                        <div class="app-details">
                            <h4>${app.full_name}</h4>
                            <p>For: ${app.job_title || 'N/A'}</p>
                            <p style="font-size:11px; opacity:0.8;">${app.email}</p>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                            <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
                            <button class="btn-edit" style="padding:4px 8px; font-size:10px;">Details</button>
                        </div>
                    `;
                    container.appendChild(card);
                });
            }
        }
    } catch (err) { console.error(err); }
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

    // Close logic
    document.getElementById("closeDetailModal").onclick = () => modal.style.display = "none";
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

async function deleteJob(jobId, type) {
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
