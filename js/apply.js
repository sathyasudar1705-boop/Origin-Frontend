document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id');
    const ptJobId = urlParams.get('pt_job_id');

    let jobData = null;
    let endpoint = "";

    if (jobId) {
        endpoint = `${API_BASE_URL}/jobs/${jobId}`;
    } else if (ptJobId) {
        endpoint = `${API_BASE_URL}/part-time-jobs/${ptJobId}`;
    }

    if (endpoint) {
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                jobData = await response.json();
                fillJobSummary(jobData, jobId ? 'Full-time' : 'Part-time');
            }
        } catch (err) {
            console.error("Error fetching job details:", err);
        }
    }

    const applyForm = document.getElementById("applyForm");
    applyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Please login first.");
            window.location.href = "user_login.html";
            return;
        }

        const applicationData = {
            job_id: jobId ? parseInt(jobId) : null,
            pt_job_id: ptJobId ? parseInt(ptJobId) : null, // Backend might need handling for this
            user_id: user.id,
            full_name: document.getElementById("applyFullName").value,
            email: document.getElementById("applyEmail").value,
            phone: document.getElementById("applyPhone").value,
            current_location: document.getElementById("applyLocation").value,
            experience: document.getElementById("applyExperience").value,
            skills: document.getElementById("applySkills").value,
            expected_salary: document.getElementById("applySalary").value,
            resume_url: document.getElementById("resumeUrl").value,
            status: "Applied"
        };

        try {
            const response = await fetch(`${API_BASE_URL}/applications/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(applicationData)
            });

            if (response.ok) {
                // Robust summary data
                const summary = {
                    userName: applicationData.full_name,
                    jobTitle: jobData ? jobData.title : (jobId ? "Full-time Job" : "Part-time Job"),
                    companyName: jobData ? (jobData.company ? jobData.company.company_name : (jobData.company_name || "Company")) : "Company",
                    location: jobData ? jobData.location : applicationData.current_location
                };
                localStorage.setItem("last_application", JSON.stringify(summary));
                window.location.href = "success.html";
            } else {
                const err = await response.json();
                alert("Application failed: " + (err.detail || "Unknown error"));
            }
        } catch (err) {
            console.error("Error submitting application:", err);
            alert("Something went wrong!");
        }
    });
});

function fillJobSummary(job, type) {
    document.getElementById("jobTitle").textContent = job.title;
    document.getElementById("jobType").textContent = type;
    document.getElementById("companyName").textContent = job.company ? job.company.company_name : job.company_name;
    document.getElementById("jobLocation").textContent = job.location;
    document.getElementById("jobSalary").textContent = job.salary || "Competitive";
}
