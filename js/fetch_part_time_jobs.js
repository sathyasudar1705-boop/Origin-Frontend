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
    const jobsContainer = document.querySelector(".job-scroll-list");
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
                jobCard.classList.add("job-card");
                const salaryDisplay = job.salary ? `₹${job.salary}` : "Not specified";

                jobCard.innerHTML = `
                    <div class="card-header">
                        <h3>${job.title}</h3>
                        <span class="badge-part-time">Part-Time</span>
                    </div>
                    <p class="company">${job.company_name}</p>
                    <div class="card-meta">
                        <span>📍 ${job.location}</span>
                        <span>💰 ${salaryDisplay}</span>
                    </div>
                `;
                jobCard.onclick = () => {
                    document.querySelectorAll('.job-card').forEach(c => c.classList.remove('active'));
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

    detailView.innerHTML = `
        <div class="detail-header">
            <div class="detail-title-row">
                <h2>${job.title}</h2>
                <span class="badge-part-time">Part-Time</span>
            </div>
            <p class="detail-company">${job.company_name}</p>
            <div class="detail-meta-row">
                <span>📍 ${job.location}</span>
                <span>💰 ${salaryDisplay}</span>
                <span>🕒 Part-Time</span>
            </div>
        </div>

        <div class="detail-content">
            <h4>Job Description</h4>
            <p>${job.description || "No description available."}</p>

            <h4>Required Skills</h4>
            <div class="skill-pills">
                ${skillsHtml}
            </div>

            <h4>Benefits</h4>
            <ul>
                <li>Flexible working hours</li>
                <li>Work from home options</li>
                <li>Competitive pay</li>
                <li>Opportunity for growth</li>
            </ul>

            <button class="${applyBtnClass}" onclick="goToApplyPage(${job.id}, 'part-time')">
                ${applyBtnText}
            </button>
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

function updateJobCountDisplay(count) {
    const infoText = document.querySelector(".results-info strong");
    if (infoText) {
        infoText.textContent = `${count} part-time job${count !== 1 ? 's' : ''}`;
    }
}
