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

async function fetchJobs(q = '', location = '', jobType = '', salaryRange = '') {
    const jobsContainer = document.querySelector(".jobs-container");
    if (!jobsContainer) return;

    jobsContainer.innerHTML = `
        <div class="loading-state" style="padding: 40px; text-align: center;">
            <p style="color: var(--text-secondary);">Searching for opportunities...</p>
        </div>
    `;

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && userApplications.length === 0) {
            await fetchUserApplications(user.id);
        }

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

        // --- Frontend Filtering for Type and Salary ---
        if (jobType) {
            allJobs = allJobs.filter(j => j.type === jobType);
        }

        if (salaryRange) {
            allJobs = allJobs.filter(j => {
                const salary = (j.salary || '').toString();
                // Basic numeric extraction for comparison (assuming format like "6-12 LPA" or "₹60,000")
                const numericMatch = salary.match(/\d+/);
                const numericVal = numericMatch ? parseInt(numericMatch[0]) : 0;

                if (salaryRange === "0-3") return numericVal < 3 || salary.includes("0-3");
                if (salaryRange === "3-6") return (numericVal >= 3 && numericVal <= 6) || salary.includes("3-6");
                if (salaryRange === "6-12") return (numericVal > 6 && numericVal <= 12) || salary.includes("6-12");
                if (salaryRange === "12+") return numericVal > 12 || salary.includes("12+");
                return true;
            });
        }

        if (allJobs.length === 0) {
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

        allJobs.sort((a, b) => b.id - a.id);

        jobsContainer.innerHTML = "";
        allJobs.forEach(job => {
            const jobCard = document.createElement("div");
            jobCard.classList.add("job-item");
            const companyName = job.company ? job.company.company_name : (job.company_name || 'Enterprise Partner');
            const logoUrl = job.company ? (job.company.logo_url || job.company.logo) : null;
            const initial = companyName.charAt(0);

            let logoHtml = `<div class="job-item-logo">${initial}</div>`;
            if (logoUrl) {
                // Determine if logoUrl is absolute or needs BASE_URL prefix
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
                    <span style="color: var(--primary); font-weight: 700;">${job.salary || 'Competitive'}</span>
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
            const urlParams = new URLSearchParams(window.location.search);
            const jobId = urlParams.get('job_id');

            let targetJob = allJobs[0];
            let targetIndex = 0;

            if (jobId) {
                const foundIndex = allJobs.findIndex(j => j.id == jobId && j.type === 'Full-time');
                if (foundIndex > -1) {
                    targetJob = allJobs[foundIndex];
                    targetIndex = foundIndex;
                }
            }

            displayJobDetails(targetJob);
            const jobCards = jobsContainer.querySelectorAll('.job-item');
            if (jobCards[targetIndex]) {
                jobCards[targetIndex].classList.add('active');
                jobCards[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    const companyName = job.company ? job.company.company_name : (job.company_name || 'Enterprise Partner');
    const applyUrl = job.type === 'Full-time' ? `apply.html?job_id=${job.id}` : `apply.html?pt_job_id=${job.id}`;

    // Update fields
    document.getElementById("detailTitle").textContent = job.title;
    document.getElementById("detailCompany").textContent = companyName;
    document.getElementById("detailBadge").textContent = job.type;
    document.getElementById("detailLocation").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> ${job.location}`;
    document.getElementById("detailSalary").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> ${job.salary || 'Competitive'}`;
    document.getElementById("detailPosted").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> 1 week ago`;

    document.getElementById("detailDesc").textContent = job.description || "No description provided.";

    const skills = job.type === 'Full-time' ? (job.skills_required || "") : (job.skills || "");
    const skillsSection = document.getElementById("detailSkillsSection");
    if (skillsSection) {
        if (skills) {
            skillsSection.style.display = "block";
            document.getElementById("detailSkills").textContent = skills;
        } else {
            skillsSection.style.display = "none";
        }
    }

    const applyBtn = document.getElementById("applyBtn");
    const footer = document.querySelector(".detail-footer");

    if (applyBtn && footer) {
        applyBtn.href = applyUrl;

        // Add Save Button if not exists
        let saveBtn = document.getElementById("saveBtn");
        if (!saveBtn) {
            saveBtn = document.createElement("button");
            saveBtn.id = "saveBtn";
            saveBtn.className = "save-btn-large";
            footer.appendChild(saveBtn);
        }

        // Update Save Button State
        const saved = isJobSaved(job.id, job.type);
        saveBtn.innerHTML = saved
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg> Saved`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> Save`;

        saveBtn.className = `save-btn-large ${saved ? 'saved' : ''}`;
        saveBtn.onclick = () => toggleSaveJob(job.id, job.type);

        // Check if applied
        const isApplied = userApplications.some(app =>
            (job.type === 'Full-time' && app.job_id === job.id) ||
            (job.type === 'Part-time' && app.pt_job_id === job.id)
        );

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

function toggleSaveJob(jobId, type) {
    let saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    const index = saved.findIndex(j => j.id === jobId && j.type === type);

    if (index > -1) {
        saved.splice(index, 1);
    } else {
        if (currentJob) {
            saved.push({
                id: currentJob.id,
                title: currentJob.title,
                company_name: currentJob.company ? currentJob.company.company_name : (currentJob.company_name || 'Enterprise Partner'),
                company_logo: currentJob.company ? (currentJob.company.logo_url || currentJob.company.logo) : null,
                location: currentJob.location,
                type: currentJob.type,
                salary: currentJob.salary
            });
        }
    }
    localStorage.setItem("saved_jobs", JSON.stringify(saved));

    // Refresh the UI to show updated state
    if (currentJob && currentJob.id === jobId && currentJob.type === type) {
        displayJobDetails(currentJob);
    }
}

// Add listeners for search inputs
document.addEventListener("DOMContentLoaded", () => {
    const roleSearchInput = document.getElementById("roleSearchInput");
    const locSearchInput = document.getElementById("locationSearchInput");
    const typeSearchInput = document.getElementById("typeSearchInput");
    const salarySearchInput = document.getElementById("salarySearchInput");

    const handleSearch = () => {
        const q = roleSearchInput ? roleSearchInput.value : '';
        const loc = locSearchInput ? locSearchInput.value : '';
        const type = typeSearchInput ? typeSearchInput.value : '';
        const sal = salarySearchInput ? salarySearchInput.value : '';
        fetchJobs(q, loc, type, sal);
    };

    if (roleSearchInput) roleSearchInput.addEventListener("input", debounce(handleSearch, 500));
    if (locSearchInput) locSearchInput.addEventListener("input", debounce(handleSearch, 500));
    if (typeSearchInput) typeSearchInput.addEventListener("change", handleSearch);
    if (salarySearchInput) salarySearchInput.addEventListener("change", handleSearch);

    // Handle profile pic from logged user
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.profile_image) {
        const topPic = document.getElementById("topNavProfilePic");
        if (topPic) topPic.src = `${API_BASE_URL}${user.profile_image}`;
    }

    fetchJobs();
});

function isJobSaved(jobId, type) {
    const saved = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    return saved.some(j => j.id === jobId && j.type === type);
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

