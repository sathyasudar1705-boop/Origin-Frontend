document.addEventListener('DOMContentLoaded', () => {
    const jobItems = document.querySelectorAll('.job-item');
    const detailPane = document.querySelector('.job-detail-pane');
    const searchLayout = document.querySelector('.search-layout');

    // Sample data (in a real app, this would come from an API)
    const jobsData = [
        {
            id: 1,
            title: "Frontend Developer",
            company: "TechCorp Solutions",
            type: "Full-time",
            location: "Bangalore, India",
            salary: "₹6-10 LPA",
            exp: "2-4 years",
            posted: "2 days ago",
            description: "Looking for an experienced frontend developer to join our dynamic team.",
            skills: ["React", "TypeScript", "Tailwind CSS"],
            respon: ["Develop and maintain high-quality code", "Collaborate with cross-functional teams", "Participate in code reviews", "Architecture planning"]
        },
        {
            id: 2,
            title: "Full Stack Engineer",
            company: "Innovation Labs",
            type: "Full-time",
            location: "Remote",
            salary: "₹8-15 LPA",
            exp: "3-5 years",
            posted: "1 day ago",
            description: "We are seeking a Full Stack Engineer to build scalable web applications.",
            skills: ["Node.js", "React", "MongoDB"],
            respon: ["Design and implement RESTful APIs", "Optimize applications for maximum speed", "Ensure data security and protection", "Troubleshoot and debug applications"]
        }
        // Add more mock data as needed to match HTML items
    ];

    function updateDetailView(job) {
        // Update DOM elements in the detail pane
        detailPane.querySelector('.detail-title-row h2').textContent = job.title;
        detailPane.querySelector('.detail-title-row .badge').textContent = job.type;
        detailPane.querySelector('.detail-company').textContent = job.company;
        
        const metaSpans = detailPane.querySelectorAll('.detail-meta span');
        if(metaSpans.length >= 4) {
            metaSpans[0].textContent = `📍 ${job.location}`;
            metaSpans[1].textContent = `💰 ${job.salary}`;
            metaSpans[2].textContent = `💼 ${job.exp}`;
            metaSpans[3].textContent = `🕒 Posted ${job.posted}`;
        }

        // Update Description
        // Note: In a real app, use innerHTML with sanitized content if rich text is needed
        const descSection = detailPane.querySelector('.detail-body p'); 
        if(descSection) descSection.textContent = job.description;

        // Update Skills
        const skillsContainer = detailPane.querySelector('.skills-tags');
        if(skillsContainer) {
            skillsContainer.innerHTML = job.skills.map(skill => `<span>${skill}</span>`).join('');
        }

        // Update Responsibilities
        const responList = detailPane.querySelector('.detail-body ul');
        if(responList) {
            responList.innerHTML = job.respon.map(item => `<li>${item}</li>`).join('');
        }

        // Show pane on mobile
        if (window.innerWidth <= 768) {
            searchLayout.classList.add('show-details');
        }
    }

    jobItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Remove active class from all
            jobItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked
            item.classList.add('active');

            // In a real scenario, use data-id to find the job. 
            // Here assuming order matches jobsData for demo (or use modulo/fallback)
            const job = jobsData[index % jobsData.length];
            updateDetailView(job);
        });
    });

    // Handle Back button for mobile (needs to be created dynamically or exist in HTML)
    // We will ensure a back button exists in the HTML update
    const backBtn = document.createElement('button');
    backBtn.className = 'back-to-list-btn';
    backBtn.textContent = '← Back to Jobs';
    backBtn.style.marginBottom = '15px';
    backBtn.style.display = 'none'; // hidden by default (desktop)
    
    // Insert at top of detail pane
    detailPane.insertBefore(backBtn, detailPane.firstChild);

    backBtn.addEventListener('click', () => {
        searchLayout.classList.remove('show-details');
    });
});
