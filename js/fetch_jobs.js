// Global variable to store user applications for the current session
let userApplications = [];

async function fetchUserApplications(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/user/${userId}`);
        if (response.ok) {
            userApplications = await response.json();
        }
    } catch (err) {
        console.error("Error fetching applications:", err);
    }
}

async function fetchJobs(q = '', location = '') {
    const jobsContainer = document.querySelector(".jobs-container");
    if (!jobsContainer) return;

    jobsContainer.innerHTML = "<p class='loading'>Loading jobs...</p>";

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && userApplications.length === 0) {
            await fetchUserApplications(user.id);
        }

        // Fetch both full-time and part-time
        const ftUrl = new URL(`${API_BASE_URL}/jobs/`);
        const ptUrl = new URL(`${API_BASE_URL}/part_time_jobs/`);

        if (q) {
            ftUrl.searchParams.append('q', q);
            ptUrl.searchParams.append('q', q);
        }
        if (location) {
            ftUrl.searchParams.append('location', location);
            ptUrl.searchParams.append('location', location);
        }

        const [ftRes, ptRes] = await Promise.all([fetch(ftUrl), fetch(ptUrl)]);
        let allJobs = [];

        if (ftRes.ok) {
            const ftJobs = await ftRes.json();
            allJobs = [...allJobs, ...ftJobs.map(j => ({ ...j, type: 'Full-time' }))];
        }
        if (ptRes.ok) {
            const ptJobs = await ptRes.json();
            allJobs = [...allJobs, ...ptJobs.map(j => ({ ...j, type: 'Part-time' }))];
        }

        if (allJobs.length === 0) {
            jobsContainer.innerHTML = "<p class='no-data'>No results found.</p>";
            const detailPane = document.querySelector(".job-detail-pane");
            if (detailPane) {
                detailPane.innerHTML = `
                    <div class="empty-detail-state" style="text-align: center; padding: 40px; color: #666;">
                        <h3>No Job Selected</h3>
                        <p>Search and select a job from the list to view its details.</p>
                    </div>
                `;
            }
            return;
        }

        // Sort by ID
        allJobs.sort((a, b) => b.id - a.id);

        jobsContainer.innerHTML = "";
        allJobs.forEach(job => {
            const jobCard = document.createElement("div");
            jobCard.classList.add("job-item");
            const badgeClass = job.type === 'Full-time' ? 'blue' : 'part-time';
            const companyName = job.company ? job.company.company_name : (job.company_name || 'Unknown Company');

            const initial = companyName.charAt(0);
            jobCard.innerHTML = `
                <div class="job-logo">${initial}</div>
                <div class="job-content">
                    <h4>${job.title}</h4>
                    <p class="company">${companyName}</p>
                    <p class="location-line">${job.location} (Remote)</p>
                    <div class="job-item-meta">
                        <span>${job.type}</span>
                        <span>•</span>
                        <span>Actively hiring</span>
                    </div>
                </div>
            `;
            jobCard.onclick = () => {
                document.querySelectorAll('.job-item').forEach(c => c.classList.remove('active'));
                jobCard.classList.add('active');
                displayJobDetails(job);
            };
            jobsContainer.appendChild(jobCard);
        });

        if (allJobs.length > 0) {
            displayJobDetails(allJobs[0]);
            jobsContainer.firstElementChild.classList.add('active');
        }

    } catch (err) {
        console.error(err);
        jobsContainer.innerHTML = "<p class='error'>Failed to load jobs. Please try again later.</p>";
    }
}

function displayJobDetails(job) {
    const detailPane = document.querySelector(".job-detail-pane");
    if (!detailPane) return;

    const badgeClass = job.type === 'Full-time' ? 'blue' : 'part-time';
    const companyName = job.company ? job.company.company_name : (job.company_name || 'Unknown Company');
    const applyUrl = job.type === 'Full-time' ? `apply.html?job_id=${job.id}` : `apply.html?pt_job_id=${job.id}`;

    // Check if applied
    const isApplied = userApplications.some(app =>
        (job.type === 'Full-time' && app.job_id === job.id) ||
        (job.type === 'Part-time' && app.pt_job_id === job.id)
    );

    const applyBtnText = "Apply for this Job";
    const applyBtnClass = "apply"; // Keep it neutral blue/primary

    // Skills mapping
    const skills = job.type === 'Full-time' ? (job.skills_required || "") : (job.skills || "");
    const skillsHtml = skills.split(',').filter(s => s.trim()).map(s => `<span>${s.trim()}</span>`).join('') || "<span>General</span>";

    detailPane.innerHTML = `
        <div class="detail-header">
            <h2>${job.title}</h2>
            <div class="detail-company-line">
                <a href="#">${companyName}</a> · ${job.location} · 1 week ago
            </div>
            
            <div class="detail-meta">
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> ${job.type}</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 10,001+ employees</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Skills: ${skills.split(',')[0]} and more</span>
            </div>

            <div class="action-row">
                <a href="${applyUrl}" class="apply">Apply Now</a>
                <button class="btn-secondary" onclick="toggleSaveJob(${job.id}, '${job.type}')" id="saveBtn-${job.id}">
                    ${isJobSaved(job.id, job.type) ? 'Saved' : 'Save'}
                </button>
            </div>
        </div>

        <div class="detail-body">
            <h3>About the job</h3>
            <p>${job.description || "No description provided."}</p>

            <h3>Required Skills</h3>
            <div class="skills-tags">
                ${skillsHtml}
            </div>
        </div>
    `;
}

// Add listeners for search inputs
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search-main input");
    const locInput = document.querySelector(".location-input input");

    const handleSearch = () => {
        const q = searchInput ? searchInput.value : '';
        const loc = locInput ? locInput.value : '';
        fetchJobs(q, loc);
    };

    if (searchInput) searchInput.addEventListener("input", debounce(handleSearch, 500));
    if (locInput) locInput.addEventListener("input", debounce(handleSearch, 500));

    fetchJobs();
});

function isJobSaved(jobId, type) {
    const saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    return saved.some(j => j.id === jobId && j.type === type);
}

function toggleSaveJob(jobId, type) {
    let saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    const index = saved.findIndex(j => j.id === jobId && j.type === type);

    // Find the job object from the list (this requires allJobs to be accessible or passed)
    // For simplicity, we'll store a minimal job object or we might need to change how this is called
    // Let's assume we can re-find it or we store the current job in a global variable
    if (index > -1) {
        saved.splice(index, 1);
        alert("Job removed from saved list.");
    } else {
        // We need the full job object. In a real app, we'd fetch it or have it in a global state.
        // For now, let's use a trick: get it from the last job passed to displayJobDetails
        const job = currentJob;
        if (job) {
            saved.push({
                id: job.id,
                title: job.title,
                company_name: job.company ? job.company.company_name : (job.company_name || 'Enterprise Partner'),
                location: job.location,
                type: job.type,
                salary: job.salary
            });
            alert("Job saved successfully!");
        }
    }
    localStorage.setItem("saved_jobs", JSON.stringify(saved));
    const btn = document.getElementById(`saveBtn-${jobId}`);
    if (btn) btn.textContent = isJobSaved(jobId, type) ? 'Saved' : 'Save';
}

let currentJob = null;

// Update displayJobDetails to set currentJob
const originalDisplayJobDetails = displayJobDetails;
displayJobDetails = function (job) {
    currentJob = job;
    originalDisplayJobDetails(job);
};

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

