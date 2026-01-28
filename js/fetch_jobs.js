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

            jobCard.innerHTML = `
                <div class="job-item-header">
                    <h4>${job.title}</h4>
                    <span class="badge ${badgeClass}">${job.type}</span>
                </div>
                <p class="company">${companyName}</p>
                <div class="job-item-meta">
                    <span>📍 ${job.location}</span>
                    <span>💰 ${job.salary || 'Competitive'}</span>
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

    const applyBtnText = isApplied ? "Applied" : "Apply for this Job";
    const applyBtnClass = isApplied ? "apply applied" : "apply";

    // Skills mapping
    const skills = job.type === 'Full-time' ? (job.skills_required || "") : (job.skills || "");
    const skillsHtml = skills.split(',').filter(s => s.trim()).map(s => `<span>${s.trim()}</span>`).join('') || "<span>General</span>";

    detailPane.innerHTML = `
        <div class="detail-header">
            <div class="detail-title-row">
                <h2>${job.title}</h2>
                <span class="badge ${badgeClass}">${job.type}</span>
            </div>
            <p class="detail-company">${companyName}</p>
            <div class="detail-meta">
                <span>📍 ${job.location}</span>
                <span>💰 ${job.salary || 'Competitive'}</span>
                <span>🕒 Posted Recently</span>
            </div>
        </div>

        <div class="detail-body">
            <h3>Job Description</h3>
            <p>${job.description || "No description provided."}</p>

            <h3>Required Skills</h3>
            <div class="skills-tags">
                ${skillsHtml}
            </div>

            <button class="${applyBtnClass}">
                ${isApplied ? applyBtnText : `<a href="${applyUrl}">${applyBtnText}</a>`}
            </button>
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

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

