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

async function fetchPartTimeJobs(q = '', location = '') {
    const jobsContainer = document.querySelector(".job-list-pane");
    if (!jobsContainer) return;

    jobsContainer.innerHTML = "<p>Loading part-time jobs...</p>";

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && userApplications.length === 0) {
            await fetchUserApplications(user.id);
        }

        const url = new URL(`${API_BASE_URL}/part_time_jobs/`);
        // Ensure q and location are strings to avoid [object Event] bug
        if (typeof q === 'string' && q.trim()) url.searchParams.append('q', q);
        if (typeof location === 'string' && location.trim()) url.searchParams.append('location', location);

        const response = await fetch(url);
        if (response.ok) {
            const jobs = await response.json();

            if (jobs.length === 0) {
                jobsContainer.innerHTML = "<p>No results found.</p>";
                updateJobCountDisplay(0);
                return;
            }

            updateJobCountDisplay(jobs.length);

            jobsContainer.innerHTML = "";
            jobs.forEach(job => {
                const jobCard = document.createElement("div");
                jobCard.classList.add("job-item");
                const salaryDisplay = job.salary ? `₹${job.salary}` : "Not specified";

                const initial = job.company_name ? job.company_name.charAt(0) : 'J';
                jobCard.innerHTML = `
                    <div class="job-logo">${initial}</div>
                    <div class="job-content">
                        <h4>${job.title}</h4>
                        <p class="company">${job.company_name}</p>
                        <p class="location-line">${job.location} (Remote)</p>
                        <div class="job-item-meta">
                            <span>Part-Time</span>
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

            if (jobs.length > 0) {
                displayJobDetails(jobs[0]);
                jobsContainer.firstElementChild.classList.add('active');
            }
        }
    } catch (err) { console.error(err); }
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search-main input");
    const locInput = document.querySelector(".location-input input");

    const handleSearch = () => {
        const q = searchInput ? searchInput.value : '';
        const loc = locInput ? locInput.value : '';
        fetchPartTimeJobs(q, loc);
    };

    if (searchInput) searchInput.addEventListener("input", debounce(handleSearch, 500));
    if (locInput) locInput.addEventListener("input", debounce(handleSearch, 500));

    fetchPartTimeJobs();
});

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function displayJobDetails(job) {
    const detailView = document.querySelector(".job-details-view");
    const salaryDisplay = job.salary ? `₹${job.salary}` : "Not specified";

    const isApplied = userApplications.some(app => app.pt_job_id === job.id);
    const applyBtnText = "Apply for this Job";
    const applyBtnClass = "apply";

    // Create tags HTML
    const skillsHtml = job.skills
        ? job.skills.split(',').map(skill => `<span>${skill.trim()}</span>`).join('')
        : '<span>General</span>';

    const detailPane = document.getElementById("ptJobDetailView");
    if (!detailPane) return;

    detailPane.innerHTML = `
        <div class="detail-header">
            <h2>${job.title}</h2>
            <div class="detail-company-line">
                <a href="#">${job.company_name}</a> · ${job.location} · 2 days ago
            </div>
            
            <div class="detail-meta">
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> Part-Time</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg> ${salaryDisplay}</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Skills: ${job.skills ? job.skills.split(',')[0] : 'General'} and more</span>
            </div>

            <div class="action-row">
                <a href="apply.html?pt_job_id=${job.id}" class="apply">Apply Now</a>
                <button class="btn-secondary" onclick="toggleSaveJob(${job.id}, 'Part-Time')" id="saveBtn-${job.id}">
                    ${isJobSaved(job.id, 'Part-Time') ? 'Saved' : 'Save'}
                </button>
            </div>
        </div>

        <div class="detail-body">
            <h3>About the job</h3>
            <p>${job.description || "No description available."}</p>

            <h3>Required Skills</h3>
            <div class="skills-tags">
                ${skillsHtml}
            </div>
        </div>
    `;
}

function goToApplyPage(jobId, type) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Please login to apply.");
        window.location.href = "user_login.html";
        return;
    }
    const param = type === 'full-time' ? `job_id=${jobId}` : `pt_job_id=${jobId}`;
    window.location.href = `apply.html?${param}`;
}

function isJobSaved(jobId, type) {
    const saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    return saved.some(j => j.id === jobId && j.type === type);
}

function toggleSaveJob(jobId, type) {
    let saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    const index = saved.findIndex(j => j.id === jobId && j.type === type);

    if (index > -1) {
        saved.splice(index, 1);
        alert("Job removed from saved list.");
    } else {
        const job = currentJob;
        if (job) {
            saved.push({
                id: job.id,
                title: job.title,
                company_name: job.company_name || 'Enterprise Partner',
                location: job.location,
                type: 'Part-Time',
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

// Wrap displayJobDetails to track currentJob
const originalDisplayPTJobDetails = displayJobDetails;
displayJobDetails = function (job) {
    currentJob = job;
    originalDisplayPTJobDetails(job);
};

function updateJobCountDisplay(count) {
    const infoText = document.querySelector(".results-info strong");
    if (infoText) {
        infoText.textContent = `${count} part-time job${count !== 1 ? 's' : ''}`;
    }
}
