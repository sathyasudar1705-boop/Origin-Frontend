document.addEventListener('DOMContentLoaded', () => {
    const jobItems = document.querySelectorAll('.job-card');
    const detailPane = document.querySelector('.job-details-view'); // Note: Different class name in HTML
    const jobLayout = document.querySelector('.job-layout'); // Wrapper
    // Note: p-t jobs has a different structure: .split-pane > aside & section
    // We might need to adjust CSS to target .job-layout or .split-pane for the .show-details class

    const splitPane = document.querySelector('.split-pane');

    // Sample data
    const jobsData = [
        {
            id: 1,
            title: "Content Writer",
            company: "Digital Media Hub",
            type: "Part-Time",
            location: "Remote",
            salary: "₹15,000-25,000/month",
            hours: "20 hours/week",
            description: "Create engaging content for blogs, social media, and marketing materials.",
            skills: ["Content Writing", "SEO", "Research"],
            schedule: "Flexible hours"
        },
        {
            id: 2,
            title: "Graphic Designer",
            company: "Creative Studio",
            type: "Part-Time",
            location: "Bangalore, India",
            salary: "₹20,000-35,000/month",
            hours: "25 hours/week",
            description: "Design visual content for print and digital media. Work with marketing team.",
            skills: ["Photoshop", "Illustrator", "Creativity"],
            schedule: "Weekends & Evenings"
        },
        {
            id: 3,
            title: "UI/UX Designer",
            company: "Creative Studio",
            type: "Part-Time",
            location: "Chennai, India",
            salary: "₹15,000-20,000/month",
            hours: "15 hours/week",
            description: "Assist in designing user interfaces for mobile apps.",
            skills: ["Figma", "Photoshop", "Prototyping"],
            schedule: "Flexible"
        }
    ];

    function updateDetailView(job) {
        // Update DOM elements
        detailPane.querySelector('.detail-title-row h2').textContent = job.title;
        detailPane.querySelector('.detail-company').textContent = job.company;

        const metaSpans = detailPane.querySelectorAll('.detail-meta-row span');
        if (metaSpans.length >= 4) {
            metaSpans[0].textContent = `📍 ${job.location}`;
            metaSpans[1].textContent = `💰 ${job.salary}`;
            metaSpans[2].textContent = `🕒 ${job.hours}`;
            metaSpans[3].textContent = `💼 ${job.schedule}`;
        }

        // Update Description
        const sections = detailPane.querySelectorAll('.detail-content p');
        if (sections.length > 0) sections[0].textContent = job.description;

        // Update Skills
        const skillsContainer = detailPane.querySelector('.skill-pills');
        if (skillsContainer) {
            skillsContainer.innerHTML = job.skills.map(skill => `<span>${skill}</span>`).join('');
        }

        // Update Schedule Box
        const scheduleBox = detailPane.querySelector('.schedule-box');
        if (scheduleBox) {
            scheduleBox.innerHTML = `
                <p><strong>Schedule:</strong> ${job.schedule}</p>
                <p><strong>Hours:</strong> ${job.hours}</p>
            `;
        }

        // Show pane on mobile
        if (window.innerWidth <= 900) {
            splitPane.classList.add('show-details');
        }
    }

    jobItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Remove active class
            jobItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const job = jobsData[index % jobsData.length];
            updateDetailView(job);
        });
    });

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-to-list-btn'; // We need to add this class to CSS
    backBtn.textContent = '← Back to Jobs';
    backBtn.style.marginBottom = '15px';
    backBtn.style.display = 'none'; // hidden by default

    // Insert at top
    detailPane.insertBefore(backBtn, detailPane.firstChild);

    backBtn.addEventListener('click', () => {
        splitPane.classList.remove('show-details');
    });
});
