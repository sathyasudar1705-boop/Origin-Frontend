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

        // 4. Hook up Resume Download Button
        const resumeBtn = document.getElementById("createResumeBtn");
        if (resumeBtn) {
            resumeBtn.addEventListener("click", () => {
                window.location.href = "resume_form.html";
            });
        }

    } catch (err) {
        console.error("Dashboard initialization failed:", err);
    }
});



const INDUSTRY_NEWS_MAPPING = {
    "doctor": { query: "medicine healthcare medical research", title: "Healthcare Updates", tag: "Healthcare" },
    "it": { query: "technology software artificial intelligence", title: "Tech Industry News", tag: "Technology" },
    "teacher": { query: "education teaching learning pedagogy", title: "Education Updates", tag: "Education" },
    "nurse": { query: "nursing healthcare medical clinic", title: "Nursing & Health", tag: "Healthcare" },
    "engineer": { query: "engineering technology innovation", title: "Engineering Frontier", tag: "Engineering" },
    "finance": { query: "finance banking fintech investment", title: "Finance & Economy", tag: "Finance" },
    "designer": { query: "graphic design ux ui creative industry", title: "Creative Industry", tag: "Design" },
    "marketing": { query: "marketing advertising digital media", title: "Marketing Insights", tag: "Marketing" }
};

async function fetchDailyNews() {
    const container = document.getElementById("dailyNewsContainer");
    const headingEl = document.getElementById("newsHeading");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!container || !user) return;

    try {
        // 1. Get user profession from profile
        let profession = "General";
        const profileRes = await fetch(`${API_BASE_URL}/jobseeker-profile/user/${user.id}`);
        if (profileRes.ok) {
            const profile = await profileRes.json();
            profession = profile.desired_job || "General";
        }

        // 2. Determine Industry Mapping
        let match = null;
        const profLower = profession.toLowerCase();
        for (const key in INDUSTRY_NEWS_MAPPING) {
            if (profLower.includes(key)) {
                match = INDUSTRY_NEWS_MAPPING[key];
                break;
            }
        }

        const query = match ? match.query : "career development workplace industry trends";
        const displayTitle = match ? match.title : "Trending Industry News";
        const categoryTag = match ? match.tag : "Career";

        // Update heading
        if (headingEl) {
            headingEl.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:8px;">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
                    <path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path>
                </svg>
                ${displayTitle}
            `;
        }

        // 3. Fetch from Backend Proxy (to avoid CORS and protect API key)
        const newsUrl = `${API_BASE_URL}/daily-news/?q=${encodeURIComponent(query)}`;
        const newsResponse = await fetch(newsUrl);

        if (newsResponse.ok) {
            const articles = await newsResponse.json();

            if (!articles || articles.length === 0) {
                container.innerHTML = `
                    <div class="empty-news">
                        <p>No specific updates for ${profession} right now. Stay tuned!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = "";
            articles.forEach(article => {
                const newsCard = document.createElement("a");
                newsCard.href = article.url;
                newsCard.target = "_blank";
                newsCard.classList.add("news-card-premium");

                const date = article.date || "Today";
                const imageUrl = article.urlToImage || 'https://images.unsplash.com/photo-1504711432869-efd597cdd042?auto=format&fit=crop&q=80&w=300&h=200';

                newsCard.innerHTML = `
                    <div class="news-card-body">
                        <h4 class="news-title" title="${article.title}">${article.title}</h4>
                        <div class="news-card-footer">
                            <div class="news-source-info">
                                <span class="news-date">${date}</span>
                            </div>
                            <span class="news-read-more">
                                Read More
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </span>
                        </div>
                    </div>
                `;
                container.appendChild(newsCard);
            });
        } else {
            throw new Error("Backend news fetch failed");
        }
    } catch (err) {
        console.error("News Redesign Error:", err);
        container.innerHTML = "<p style='color:var(--text-secondary); font-size: 0.9rem; padding: 20px; text-align: center;'>Unable to load personalized news at the moment.</p>";
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
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const fileName = `OriginX_Resume_${(user.full_name || 'User').replace(/ /g, "_")}.pdf`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            console.log("Failed to generate resume. Please update your profile details first.");
        }
    } catch (error) {
        console.error("Error generating resume:", error);
        console.log("An error occurred.");
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
        const [ftRes, ptRes] = await Promise.all([
            fetch(`${API_BASE_URL}/jobs/`),
            fetch(`${API_BASE_URL}/part_time_jobs/`)
        ]);

        let allJobs = [];
        if (ftRes.ok) {
            const ftJobs = await ftRes.json();
            allJobs = [...allJobs, ...ftJobs.filter(j => j.company || j.company_name).map(j => ({ ...j, type: 'Full-time' }))];
        }
        if (ptRes.ok) {
            const ptJobs = await ptRes.json();
            allJobs = [...allJobs, ...ptJobs.filter(j => j.company || j.company_name).map(j => ({ ...j, type: 'Part-time' }))];
        }

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

            const companyName = job.company ? job.company.company_name : (job.company_name || 'Enterprise Partner');
            const rawLogo = job.company ? (job.company.logo_url || job.company.logo) : null;
            let companyLogo = `https://ui-avatars.com/api/?name=${companyName}&background=f4f7fe&color=4318ff`;
            if (rawLogo) {
                companyLogo = rawLogo.startsWith('http') ? rawLogo : `${API_BASE_URL}${rawLogo}`;
            }

            const applyUrl = job.type === 'Full-time' ? `apply.html?job_id=${job.id}` : `apply.html?pt_job_id=${job.id}`;
            const detailUrl = job.type === 'Full-time' ? `jobs.html?job_id=${job.id}` : `part_time_jobs.html?pt_job_id=${job.id}`;
            const postedDate = job.created_at ? timeSince(new Date(job.created_at)) : '2 days';
            const skills = job.skills_required || job.skills || 'React • Node.js • MongoDB';
            const location = job.location || 'Remote';
            const salary = job.salary || '₹6–12 LPA';
            const experience = job.experience || '0-2 Years';
            const workMode = job.work_mode || 'On-site';
            const rating = job.rating || '4.5';

            const isSaved = isJobSaved(job.id, job.type);

            card.innerHTML = `
                <div class="job-card-header">
                    <div class="job-company-info">
                        <img src="${companyLogo}" alt="${companyName}" class="job-company-logo" onerror="this.src='https://ui-avatars.com/api/?name=${companyName}&background=f4f7fe&color=4318ff'">
                        <div class="company-name-rating">
                            <h4>${companyName}</h4>
                            <div class="rating-stars">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> 
                                ${rating}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="job-main-title">${job.title}</div>

                <div class="job-meta-rows">
                    <div class="meta-row">
                        <span class="meta-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            ${location}
                        </span>
                        <span class="meta-divider">|</span>
                        <span class="meta-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                            ${job.type}
                        </span>
                        <span class="meta-divider">|</span>
                        <span class="meta-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            ${experience}
                        </span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            ${salary}
                        </span>
                        <span class="meta-divider">|</span>
                        <span class="meta-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            ${workMode}
                        </span>
                    </div>
                </div>

                <div class="skills-list">
                    <span>Skills:</span> ${skills.replace(/,/g, ' • ')}
                </div>

                <div class="posted-time">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Posted ${postedDate} ago
                </div>

                <div class="job-card-actions">
                    <a href="${applyUrl}" class="card-btn btn-apply">Apply Now</a>
                    <a href="${detailUrl}" class="card-btn btn-details">View Details</a>
                    <button class="card-btn btn-save ${isSaved ? 'saved' : ''}" onclick="toggleSaveFromCard(event, ${job.id}, '${job.title}', '${companyName}', '${rawLogo}', '${location}', '${job.type}', '${salary}')">
                        ${isSaved ? 'Saved' : 'Save Job'}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error fetching recommended jobs:", err);
        container.innerHTML = "<p>Error loading jobs.</p>";
    }
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes";
    return Math.floor(seconds) + " seconds";
}

function isJobSaved(jobId, type) {
    const saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    return saved.some(j => j.id === jobId && j.type === type);
}

function toggleSaveFromCard(event, jobId, title, companyName, logo, location, type, salary) {
    event.preventDefault();
    let saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    const index = saved.findIndex(j => j.id === jobId && j.type === type);

    if (index > -1) {
        saved.splice(index, 1);
    } else {
        saved.push({
            id: jobId,
            title: title,
            company_name: companyName,
            company_logo: logo,
            location: location,
            type: type,
            salary: salary
        });
    }
    localStorage.setItem("saved_jobs", JSON.stringify(saved));
    fetchRecommendedJobs(); // Refresh cards
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
            if (statsSelected) {
                // Count both Shortlisted and Selected as 'Positive' steps
                statsSelected.textContent = apps.filter(a => a.status === 'Shortlisted' || a.status === 'Selected').length;
            }
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
