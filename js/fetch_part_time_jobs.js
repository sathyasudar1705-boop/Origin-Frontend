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
    const jobsContainer = document.querySelector(".jobs-container");
    if (!jobsContainer) return;

    jobsContainer.innerHTML = `
        <div class="loading-state" style="padding: 40px; text-align: center;">
            <p style="color: var(--text-secondary);">Finding the best roles...</p>
        </div>
    `;

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && userApplications.length === 0) {
            await fetchUserApplications(user.id);
        }

        const url = new URL(`${API_BASE_URL}/part_time_jobs/`);
        if (typeof q === 'string' && q.trim()) url.searchParams.append('q', q);
        if (typeof location === 'string' && location.trim()) url.searchParams.append('location', location);

        const response = await fetch(url);
        if (response.ok) {
            const jobs = await response.json();

            if (jobs.length === 0) {
                jobsContainer.innerHTML = `
                    <div class="no-data" style="padding: 40px; text-align: center;">
                        <p style="color: var(--text-secondary);">No results found matching your search.</p>
                    </div>
                `;
                const placeholder = document.querySelector(".detail-placeholder");
                const content = document.querySelector(".detail-content");
                if (placeholder) placeholder.style.display = "flex";
                if (content) content.style.display = "none";
                return;
            }

            jobsContainer.innerHTML = "";
            jobs.forEach(job => {
                const jobCard = document.createElement("div");
                jobCard.classList.add("job-item");
                const companyName = job.company ? job.company.company_name : (job.company_name || 'Enterprise Partner');
                const logoUrl = job.company ? (job.company.logo_url || job.company.logo) : null;
                const initial = companyName.charAt(0);

                let logoHtml = `<div class="job-item-logo">${initial}</div>`;
                if (logoUrl) {
                    const finalLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${API_BASE_URL}${logoUrl}`;
                    logoHtml = `<div class="job-item-logo">
                        <img src="${finalLogoUrl}" alt="${companyName}" 
                             style="width:100%; height:100%; object-fit:cover; border-radius:inherit;"
                             onerror="this.parentElement.innerHTML='${initial}'">
                    </div>`;
                }

                jobCard.innerHTML = `
                    <div class="job-item-header">
                        ${logoHtml}
                        <div class="job-item-title">
                            <h4>${job.title}</h4>
                            <p>${companyName}</p>
                        </div>
                    </div>

                    <div class="job-item-footer">
                        <span>${job.location}</span>
                        <span style="color: var(--primary); font-weight: 700;">${job.salary ? '₹' + job.salary : 'Competitive'}</span>
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
    } catch (err) {
        console.error(err);
        jobsContainer.innerHTML = "<p class='error'>Failed to load jobs. Please try again later.</p>";
    }
}

function displayJobDetails(job) {
    const placeholder = document.querySelector(".detail-placeholder");
    const content = document.querySelector(".detail-content");
    if (!content) return;

    if (placeholder) placeholder.style.display = "none";
    content.style.display = "flex";

    const salaryDisplay = job.salary || "Competitive";
    const applyUrl = `apply.html?pt_job_id=${job.id}`;

    // Update fields
    document.getElementById("detailTitle").textContent = job.title;
    document.getElementById("detailCompany").textContent = job.company_name;
    document.getElementById("detailBadge").textContent = "Part-time";
    document.getElementById("detailLocation").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> ${job.location}`;
    document.getElementById("detailSalary").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> ${salaryDisplay}`;
    document.getElementById("detailPosted").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> 1 week ago`;

    document.getElementById("detailDesc").textContent = job.description || "No description provided.";

    const skills = job.skills || "";
    const skillsSection = document.getElementById("detailSkillsSection");
    const skillsContainer = document.getElementById("detailSkills");

    if (skillsSection && skillsContainer) {
        if (skills) {
            skillsSection.style.display = "block";
            skillsContainer.innerHTML = skills.split(',').map(s => `<span class="skill-pill">${s.trim()}</span>`).join('');
        } else {
            skillsSection.style.display = "none";
        }
    }

    const applyBtn = document.getElementById("applyBtn");
    if (applyBtn) {
        applyBtn.href = applyUrl;

        // Check if applied
        const isApplied = userApplications.some(app => app.pt_job_id === job.id);

        if (isApplied) {
            applyBtn.textContent = "Applied Already";
            applyBtn.style.pointerEvents = "none";
            applyBtn.style.opacity = "0.6";
        } else {
            applyBtn.textContent = "Apply Now";
            applyBtn.style.pointerEvents = "auto";
            applyBtn.style.opacity = "1";
        }
    }
}

// Add listeners for search inputs
document.addEventListener("DOMContentLoaded", () => {
    const mainSearchInput = document.getElementById("mainSearchInput");
    const locSearchInput = document.getElementById("locationSearchInput");

    const handleSearch = () => {
        const q = mainSearchInput ? mainSearchInput.value : '';
        const loc = locSearchInput ? locSearchInput.value : '';
        fetchPartTimeJobs(q, loc);
    };

    if (mainSearchInput) mainSearchInput.addEventListener("input", debounce(handleSearch, 500));
    if (locSearchInput) locSearchInput.addEventListener("input", debounce(handleSearch, 500));

    // Handle profile pic from logged user
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.profile_image) {
        const topPic = document.getElementById("topNavProfilePic");
        if (topPic) topPic.src = `${API_BASE_URL}${user.profile_image}`;
    }

    fetchPartTimeJobs();
});

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
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
                company_name: job.company ? job.company.company_name : (job.company_name || 'Enterprise Partner'),
                company_logo: job.company ? (job.company.logo_url || job.company.logo) : null,
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

// Track currentJob
const originalDisplayDetails = displayJobDetails;
displayJobDetails = function (job) {
    currentJob = job;
    originalDisplayDetails(job);
};
