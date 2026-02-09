document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "user_login.html";
        return;
    }

    // Dom Elements
    const fullNameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const locationInput = document.getElementById("location");
    const desiredJobInput = document.getElementById("desiredJob");
    const githubInput = document.getElementById("githubUrl");
    const linkedinInput = document.getElementById("linkedinUrl");
    const summaryInput = document.getElementById("summary");
    const experienceInput = document.getElementById("experience");
    const educationInput = document.getElementById("education");
    const skillsInput = document.getElementById("skills");
    const projectsInput = document.getElementById("projects");

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const submitBtn = document.getElementById("submitBtn");
    const form = document.getElementById("resumeForm");

    // Pre-fill user data
    fullNameInput.value = user.full_name || "";

    // Attempt to pre-fill from profile
    try {
        const profileRes = await fetch(`${API_BASE_URL}/jobseeker-profile/user/${user.id}`);
        if (profileRes.ok) {
            const profile = await profileRes.json();
            phoneInput.value = profile.phone || "";
            locationInput.value = profile.location || "";
            desiredJobInput.value = profile.desired_job || "";
            githubInput.value = profile.github_url || "";
            linkedinInput.value = profile.linkedin_url || "";
            summaryInput.value = profile.summary || "";
            experienceInput.value = profile.experience || "";
            educationInput.value = profile.education || "";
            skillsInput.value = profile.skills || "";
            projectsInput.value = profile.projects || "";
        }
    } catch (e) {
        console.log("No existing profile found to pre-fill.");
    }

    const steps = [
        document.getElementById("step1"),
        document.getElementById("step2"),
        document.getElementById("step3")
    ];
    const indicators = [
        document.getElementById("step1-indicator"),
        document.getElementById("step2-indicator"),
        document.getElementById("step3-indicator")
    ];

    let currentStep = 0;

    // Template selection
    const templateCards = document.querySelectorAll(".template-card");
    let selectedTemplate = "professional";

    templateCards.forEach(card => {
        card.addEventListener("click", () => {
            templateCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            selectedTemplate = card.dataset.template;
        });
    });

    function updateStepVisibility() {
        steps.forEach((step, idx) => {
            step.classList.toggle("active", idx === currentStep);
        });

        indicators.forEach((ind, idx) => {
            ind.classList.toggle("active", idx === currentStep);
            ind.classList.toggle("completed", idx < currentStep);
        });

        prevBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";

        if (currentStep === steps.length - 1) {
            nextBtn.style.display = "none";
            submitBtn.style.display = "block";
        } else {
            nextBtn.style.display = "block";
            submitBtn.style.display = "none";
            nextBtn.innerText = "Next Step";
        }
    }

    nextBtn.addEventListener("click", () => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            updateStepVisibility();
        }
    });

    prevBtn.addEventListener("click", () => {
        if (currentStep > 0) {
            currentStep--;
            updateStepVisibility();
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = {
            full_name: fullNameInput.value,
            phone: phoneInput.value,
            location: locationInput.value,
            desired_job: desiredJobInput.value,
            github_url: githubInput.value,
            linkedin_url: linkedinInput.value,
            summary: summaryInput.value,
            experience: parseInt(experienceInput.value) || 0,
            education: educationInput.value,
            skills: skillsInput.value,
            projects: projectsInput.value,
            template: selectedTemplate
        };

        submitBtn.innerText = "Processing Profile...";
        submitBtn.disabled = true;

        try {
            // 1. Update User Name
            await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: formData.full_name })
            });

            // 2. Sync with Job Seeker Profile
            let profileRes = await fetch(`${API_BASE_URL}/jobseeker-profile/user/${user.id}`);

            const profilePayload = {
                user_id: user.id,
                phone: formData.phone,
                location: formData.location,
                desired_job: formData.desired_job,
                github_url: formData.github_url,
                linkedin_url: formData.linkedin_url,
                summary: formData.summary,
                experience: formData.experience,
                education: formData.education,
                skills: formData.skills,
                projects: formData.projects
            };

            if (profileRes.ok) {
                const existingProfile = await profileRes.json();
                await fetch(`${API_BASE_URL}/jobseeker-profile/${existingProfile.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(profilePayload)
                });
            } else {
                await fetch(`${API_BASE_URL}/jobseeker-profile/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(profilePayload)
                });
            }

            // 3. Generate Resume
            submitBtn.innerText = "Downloading PDF...";
            const queryParams = new URLSearchParams({
                template: formData.template,
                show_salary: true,
                show_location: true
            }).toString();

            const response = await fetch(`${API_BASE_URL}/users/${user.id}/resume?${queryParams}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `OriginX_Resume_${formData.full_name.replace(/ /g, "_")}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                alert("Professional resume generated successfully!");
                window.location.href = "dashboard.html";
            } else {
                alert("Failed to generate resume PDF. Please check your connection.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred during resume generation.");
        } finally {
            submitBtn.innerText = "Generate My Resume";
            submitBtn.disabled = false;
        }
    });

    updateStepVisibility();
});
