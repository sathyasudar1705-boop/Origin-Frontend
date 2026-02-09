document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "user_login.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${user.full_name || 'User'}!`;


    // 1. Fetch and Display Jobs (Recommended)
    await fetchRecommendedJobs();

    // 2. Fetch and Display Applications (Recent & Stats)
    await fetchUserApplications(user.id);
});

async function generateResume(userId, options = {}) {
    const btn = document.getElementById("createResumeBtn");
    const originalText = btn.innerText;
    btn.innerText = "Generating...";
    btn.disabled = true;

    try {
        const queryParams = new URLSearchParams(options).toString();
        const response = await fetch(`${API_BASE_URL}/users/${userId}/resume?${queryParams}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resume_${options.template || 'default'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            alert("Failed to generate resume. Please update your profile details first.");
        }
    } catch (error) {
        console.error("Error generating resume:", error);
        alert("An error occurred.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function getStatusClass(status) {
    if (!status) return 'gray';
    switch (status.toLowerCase()) {
        case 'applied': return 'gray';
        case 'shortlisted': return 'green';
        case 'approved': return 'green';
        case 'interview': return 'purple';
        case 'rejected': return 'red';
        default: return 'orange';
    }
}

async function fetchRecommendedJobs() {
    const container = document.getElementById("recommendedJobsContainer");
    try {
        // Fetch both full-time and part-time jobs
        const [ftRes, ptRes] = await Promise.all([
            fetch(`${API_BASE_URL}/jobs/`),
            fetch(`${API_BASE_URL}/part_time_jobs/`)
        ]);

        let allJobs = [];

        if (ftRes.ok) {
            const ftJobs = await ftRes.json();
            // Filter to ensure only jobs with companies (as requested) are shown
            const validFtJobs = ftJobs.filter(j => j.company || j.company_name);
            allJobs = [...allJobs, ...validFtJobs.map(j => ({ ...j, type: 'Full-time' }))];
        }

        if (ptRes.ok) {
            const ptJobs = await ptRes.json();
            // Filter to ensure only jobs with companies (as requested) are shown
            const validPtJobs = ptJobs.filter(j => j.company || j.company_id || j.company_name);
            allJobs = [...allJobs, ...validPtJobs.map(j => ({ ...j, type: 'Part-time' }))];
        }

        // Sort by ID descending (newest first)
        allJobs.sort((a, b) => b.id - a.id);
        const topJobs = allJobs.slice(0, 3);

        if (topJobs.length === 0) {
            container.innerHTML = "<p>No jobs available yet.</p>";
            return;
        }

        container.innerHTML = "";
        topJobs.forEach(job => {
            const card = document.createElement("div");
            card.classList.add("job-card");
            const badgeClass = job.type === 'Full-time' ? 'full-time' : 'part-time';
            const companyName = job.company ? job.company.company_name : (job.company_name || 'Unknown Company');
            const applyUrl = job.type === 'Full-time' ? `apply.html?job_id=${job.id}` : `apply.html?pt_job_id=${job.id}`;

            card.innerHTML = `
                <div class="job-details">
                    <div class="job-title-row">
                        <h3>${job.title}</h3>
                        <span class="badge ${badgeClass}">${job.type}</span>
                    </div>
                    <p class="company-name">${companyName}</p>
                    <div class="job-meta">
                        <span style="display:flex; align-items:center; gap:4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${job.location}
                        </span>
                        <span>💰 ${job.salary || 'Competitive'}</span>
                    </div>
                </div>
                <a href="${applyUrl}" class="apply-btn">Apply Now</a>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error fetching recommended jobs:", err);
        container.innerHTML = "<p>Error loading jobs.</p>";
    }
}

async function fetchUserApplications(userId) {
    const statsApps = document.getElementById("statApps");
    const statsShortlisted = document.getElementById("statShortlisted");
    const statsInterviews = document.getElementById("statInterviews");
    const recentList = document.getElementById("recentApplicationsList");

    try {
        const response = await fetch(`${API_BASE_URL}/applications/user/${userId}`);
        if (response.ok) {
            const apps = await response.json();

            // Update Stats
            const statsSelected = document.getElementById("statSelected");
            const statsRejected = document.getElementById("statRejected");

            statsApps.textContent = apps.length;
            if (statsSelected) statsSelected.textContent = apps.filter(a => a.status === 'Approved').length;
            if (statsRejected) statsRejected.textContent = apps.filter(a => a.status === 'Rejected').length;

            // Update Recent Applications (top 3)
            const recent = apps.slice(-3).reverse();
            if (recent.length === 0) {
                recentList.innerHTML = "<p>No recent applications.</p>";
                return;
            }

            recentList.innerHTML = "";
            recent.forEach(app => {
                const item = document.createElement("div");
                item.classList.add("app-item");
                item.style.cursor = "pointer";
                item.onclick = () => window.location.href = `my_applications.html?app_id=${app.id}`;

                item.innerHTML = `
                    <div class="app-info">
                        <h4>${app.job_title || 'Unknown Job'}</h4>
                        <p style="font-size:12px; margin:2px 0; display:flex; align-items:center; gap:4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${app.job_location || 'N/A'} • 📅 ${app.created_at || 'Recently'}
                        </p>
                        <span class="status-badge ${getStatusClass(app.status)}">${app.status}</span>
                    </div>
                    <span class="app-date">View Details</span>
                `;
                recentList.appendChild(item);
            });
        }
    } catch (err) {
        console.error("Error fetching applications:", err);
    }
}

function getStatusClass(status) {
    if (!status) return 'gray';
    switch (status.toLowerCase()) {
        case 'applied': return 'gray';
        case 'shortlisted': return 'green';
        case 'approved': return 'green';
        case 'interview': return 'purple';
        case 'rejected': return 'red';
        default: return 'orange';
    }
}
