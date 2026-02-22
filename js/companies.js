document.addEventListener('DOMContentLoaded', async () => {
    const companiesGrid = document.getElementById('companiesGrid');
    const searchInput = document.getElementById('companySearch');
    const modal = document.getElementById('companyModal');
    const closeModal = document.querySelector('.close-modal');

    // Ensure API_BASE_URL is available
    const BASE_URL = window.API_BASE_URL || "http://127.0.0.1:8000";
    console.log("Using API_BASE_URL:", BASE_URL);

    let allCompanies = [];

    // Fetch all companies
    async function fetchCompanies() {
        console.log("Fetching companies...");
        companiesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Synchronizing with corporate database...</p>';

        try {
            const response = await fetch(`${BASE_URL}/companies`);
            if (response.ok) {
                allCompanies = await response.json();
                console.log("Companies fetched successfully:", allCompanies.length);
                renderCompanies(allCompanies);

                // Check for auto-open ID
                const params = new URLSearchParams(window.location.search);
                const companyId = params.get('id');
                if (companyId) {
                    const target = allCompanies.find(c => c.id == companyId);
                    if (target) showCompanyDetails(target);
                }
            } else {
                console.error("Fetch failed with status:", response.status);
                companiesGrid.innerHTML = `<p style="color: #ff4d4f; text-align: center; width: 100%;">Synchronization Error (${response.status}). Please check system status.</p>`;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            companiesGrid.innerHTML = `<p style="color: #ff4d4f; text-align: center; width: 100%;">Network Error: ${error.message}. Ensure backend is active at ${BASE_URL}</p>`;
        }
    }

    // Render companies to the grid
    function renderCompanies(companies) {
        try {
            companiesGrid.innerHTML = '';
            if (companies.length === 0) {
                companiesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">No industry partners found matching those criteria.</p>';
                return;
            }

            companies.forEach(company => {
                const card = document.createElement('div');
                card.className = 'company-card';

                // Fallback for missing fields
                const name = company.company_name || "Unknown Entity";
                const initial = name.charAt(0).toUpperCase();
                const industry = company.industry || "Strategic Partner";
                const location = company.location || "Global/Remote";

                const companyUrl = `view_company.html?id=${company.id}`;
                const logoHtml = company.logo_url ? `<img src="${company.logo_url}" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : '';

                card.innerHTML = `
                    <div class="company-card-banner"></div>
                    <div class="company-logo-wrapper" style="cursor:pointer;" onclick="window.location.href='${companyUrl}'">
                        ${logoHtml}
                        <span style="display: ${company.logo_url ? 'none' : 'flex'}">${initial}</span>
                    </div>
                    <div class="company-card-info">
                        <h3 style="cursor:pointer;" onclick="window.location.href='${companyUrl}'">${name}</h3>
                        <p class="industry">${industry}</p>
                        <div class="company-card-meta">
                            <span class="location">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                ${location}
                            </span>
                        </div>
                    </div>
                `;
                card.onclick = () => showCompanyDetails(company);
                companiesGrid.appendChild(card);
            });
        } catch (renderError) {
            console.error("Rendering error:", renderError);
            companiesGrid.innerHTML = `<p style="color: #ff4d4f; text-align: center; width: 100%;">Display Error: Failed to render company data.</p>`;
        }
    }

    // --- Personalization Logic ---
    let userApps = [];
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.id) {
            // Set Welcome Message
            const welcomeMsg = document.getElementById("welcomeUser");
            if (welcomeMsg) {
                const firstName = user.full_name ? user.full_name.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'User');
                welcomeMsg.innerText = `Welcome, ${firstName}!`;
            }

            // Populate Sidebar Profile Card
            const sidebarCard = document.getElementById("sidebarProfileCard");
            const sidebarPic = document.getElementById("sidebarUserPic");
            const sidebarName = document.getElementById("sidebarUserName");
            const sidebarEmail = document.getElementById("sidebarUserEmail");

            if (sidebarCard && sidebarName && sidebarEmail) {
                sidebarName.innerText = user.full_name || "New User";
                sidebarEmail.innerText = user.email || "";

                if (user.profile_image && sidebarPic) {
                    const imgPath = user.profile_image.startsWith('http') ? user.profile_image : `${BASE_URL}${user.profile_image}`;
                    sidebarPic.src = imgPath;
                }
                sidebarCard.style.display = "flex";
            }

            // Fetch User Applications to track "Applied" status
            const appsResponse = await fetch(`${BASE_URL}/applications/user/${user.id}`);
            if (appsResponse.ok) {
                userApps = await appsResponse.json();
            }
        }
    } catch (err) {
        console.warn("Personalization failed:", err);
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        try {
            const term = e.target.value.toLowerCase();
            const filtered = allCompanies.filter(c => {
                const nameMatch = (c.company_name || "").toLowerCase().includes(term);
                const industryMatch = (c.industry || "").toLowerCase().includes(term);
                const locationMatch = (c.location || "").toLowerCase().includes(term);
                return nameMatch || industryMatch || locationMatch;
            });
            renderCompanies(filtered);
        } catch (searchError) {
            console.error("Search error:", searchError);
        }
    });

    // Show company details in modal
    async function showCompanyDetails(company) {
        try {
            const modalBody = document.getElementById('modalBody');
            const name = company.company_name || "Unknown Entity";
            const initial = name.charAt(0).toUpperCase();

            modalBody.innerHTML = `
                <div class="modal-header-modern">
                    <div class="modal-logo-wrapper">
                        ${company.logo_url ? `<img src="${company.logo_url}" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                        <span style="display: ${company.logo_url ? 'none' : 'flex'}">${initial}</span>
                    </div>
                    <div class="modal-title-box">
                        <h2>${name}</h2>
                        <p class="tagline">${company.description || 'OriginX verified industry partner. No extended narrative provided.'}</p>
                        <div class="modal-meta-row">
                            <div class="meta-pill">${company.location || 'Remote'}</div>
                            <div class="meta-pill">${company.industry || 'Enterprise'}</div>
                            ${company.website ? `<div class="meta-pill"><a href="${company.website}" target="_blank" style="color: inherit; text-decoration: none;">View Site</a></div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-scroller">
                    <h3 style="margin-bottom: 20px;">Available Opportunities</h3>
                    <div id="companyJobsList" class="jobs-grid-modern">
                        <p style="color: var(--text-secondary);">Synchronizing job data...</p>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Fetch jobs for this company
            try {
                const response = await fetch(`${BASE_URL}/jobs/company/${company.id}`);
                const jobsList = document.getElementById('companyJobsList');
                if (response.ok) {
                    const jobs = await response.json();
                    if (jobs.length === 0) {
                        jobsList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No active requisitions detected at this time.</p>';
                    } else {
                        jobsList.innerHTML = '';
                        jobs.forEach(job => {
                            // Check if already applied
                            const hasApplied = userApps.some(app => app.job_id === job.id);

                            const jobCard = document.createElement('div');
                            jobCard.className = 'company-job-card-modern';

                            let actionHtml = `<a href="apply.html?job_id=${job.id}" class="btn-apply-small">Inquire Now</a>`;
                            if (hasApplied) {
                                actionHtml = `
                                    <div class="status-pill-applied">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Applied
                                    </div>
                                `;
                            }

                            jobCard.innerHTML = `
                                <div class="job-card-left">
                                    <h4>${job.title}</h4>
                                    <p class="job-meta">${job.location} • ${job.salary || 'Competitive Package'}</p>
                                </div>
                                ${actionHtml}
                            `;
                            jobsList.appendChild(jobCard);
                        });
                    }
                } else {
                    jobsList.innerHTML = '<p style="color: #ff4d4f;">Failed to retrieve opportunities.</p>';
                }
            } catch (jobFetchError) {
                console.error('Error fetching jobs:', jobFetchError);
                document.getElementById('companyJobsList').innerHTML = '<p style="color: #ff4d4f;">System error during opportunity sync.</p>';
            }
        } catch (modalError) {
            console.error("Modal Error:", modalError);
        }
    }

    // Modal close events
    closeModal.onclick = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    // Handle profile pic (Initial check, redundant but safe)
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.profile_image) {
            const topPic = document.getElementById("topNavProfilePic");
            if (topPic) {
                const imgPath = user.profile_image.startsWith('http') ? user.profile_image : `${BASE_URL}${user.profile_image}`;
                topPic.src = imgPath;
            }
        }
    } catch (userError) {
        console.warn("User session data error:", userError);
    }

    // Initial fetch
    fetchCompanies();
});
