document.addEventListener("DOMContentLoaded", async () => {
    try {
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

        // 3. Fetch and Display Daily News
        await fetchDailyNews();
    } catch (err) {
        console.error("Dashboard initialization failed:", err);
    }
});

async function fetchDailyNews() {
    const container = document.getElementById("dailyNewsContainer");
    try {
        const response = await fetch(`${API_BASE_URL}/daily-news/`);
        if (response.ok) {
            const news = await response.json();
            if (news.length === 0) {
                container.innerHTML = "<p style='color:var(--text-secondary); font-size: 0.9rem;'>No news available.</p>";
                return;
            }

            container.innerHTML = "";
            news.forEach(item => {
                const newsEl = document.createElement("a");
                newsEl.href = item.url;
                newsEl.target = "_blank";
                newsEl.classList.add("news-item");
                newsEl.innerHTML = `
                    <h4>${item.title}</h4>
                    <div class="read-more-link">
                        Read Article 
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <div class="news-meta">
                        <span class="news-source">${item.source}</span>
                        <span>${item.date}</span>
                    </div>
                `;
                container.appendChild(newsEl);
            });

            // Add attribution
            const attribution = document.createElement("p");
            attribution.classList.add("news-attribution");
            attribution.textContent = "News data provided by NewsAPI.org";
            container.appendChild(attribution);
        }
    } catch (err) {
        console.error("Error fetching news:", err);
        container.innerHTML = "<p style='color:var(--text-secondary); font-size: 0.9rem;'>No news available</p>";
    }
}

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
        const topJobs = allJobs.slice(0, 4);

        if (topJobs.length === 0) {
            container.innerHTML = "<p>No jobs available yet.</p>";
            return;
        }

        container.innerHTML = "";
        topJobs.forEach(job => {
            const card = document.createElement("div");
            card.classList.add("job-card");
            const companyName = job.company ? job.company.company_name : (job.company_name || 'Unknown Company');

            // Better logo resolution
            const rawLogo = job.company ? (job.company.logo_url || job.company.logo) : null;
            let companyLogo = `https://ui-avatars.com/api/?name=${companyName}&background=f4f7fe&color=4318ff`;

            if (rawLogo) {
                companyLogo = rawLogo.startsWith('http') ? rawLogo : `${API_BASE_URL}${rawLogo}`;
            }

            const applyUrl = job.type === 'Full-time' ? `apply.html?job_id=${job.id}` : `apply.html?pt_job_id=${job.id}`;

            card.innerHTML = `
                <div class="job-card-header">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <span class="job-type-badge ${job.type === 'Full-time' ? 'badge-full-time' : 'badge-part-time'}">${job.type}</span>
                        <span class="new-post-badge">New Post</span>
                    </div>
                    <div class="meta-tag rating">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        5.0
                    </div>
                </div>
                <div class="job-company-info">
                    <img src="${companyLogo}" alt="${companyName}" class="job-company-logo" onerror="this.src='https://ui-avatars.com/api/?name=${companyName}&background=f4f7fe&color=4318ff'">
                    <div class="job-title-wrapper">
                        <h3>${job.title}</h3>
                        <p>${companyName}</p>
                    </div>
                </div>
                <div class="job-meta-row">
                    <div class="meta-tag">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        ${job.location}
                    </div>
                    <div class="meta-tag">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Fixed
                    </div>
                </div>
                <div class="job-details-text">
                    ${job.description ? job.description : 'Innovative role at leading company. Competitive benefits and growth opportunities included...'}
                </div>
                <div class="job-card-footer">
                    <div class="job-price">${job.salary || 'Comp.'}</div>
                    <a href="${applyUrl}" class="apply-btn-main">View Details</a>
                </div>
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

            // Update Recent Applications (top 5 for the new sidebar height)
            const recent = apps.slice(-5).reverse();
            if (recent.length === 0) {
                recentList.innerHTML = "<p>No recent applications.</p>";
                return;
            }

            recentList.innerHTML = "";
            recent.forEach(app => {
                const item = document.createElement("div");
                item.classList.add("app-item-modern");
                item.style.cursor = "pointer";
                item.onclick = () => window.location.href = `my_applications.html?app_id=${app.id}`;

                item.innerHTML = `
                    <div class="app-details">
                        <h4>${app.job_title || 'Unknown Job'}</h4>
                        <p style="font-size:12px; color:var(--text-secondary);">${app.job_location || 'Remote'}</p>
                    </div>
                    <span class="badge ${getStatusClass(app.status)}">${app.status}</span>
                `;
                recentList.appendChild(item);
            });
        }
    } catch (err) {
        console.error("Error fetching applications:", err);
    }
}
