/**
 * nav-profile.js
 * Shared utility: Load user DP on every page's top-nav avatar.
 * Include this AFTER config.js on every seeker page.
 */
(function () {
    function loadNavProfile() {
        const imgEl = document.getElementById("topNavProfilePic");
        if (!imgEl) return;

        // Make the avatar a link to profile.html if not already wrapped
        const parent = imgEl.parentElement;
        if (parent && parent.tagName !== "A") {
            const anchor = document.createElement("a");
            anchor.href = "profile.html";
            anchor.title = "My Profile";
            anchor.style.cssText = "display:inline-flex;align-items:center;cursor:pointer;";
            parent.insertBefore(anchor, imgEl);
            anchor.appendChild(imgEl);
        } else if (parent && parent.tagName === "A") {
            parent.href = "profile.html";
            parent.title = "My Profile";
        }

        // Load profile image from session
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user) return;

        // Generate initials fallback URL
        const name = encodeURIComponent(user.full_name || user.email || "U");
        const fallbackSrc = `https://ui-avatars.com/api/?name=${name}&background=4318ff&color=fff&bold=true`;

        if (user.profile_image) {
            const BASE = window.API_BASE_URL || "http://127.0.0.1:8000";
            const src = user.profile_image.startsWith("http")
                ? user.profile_image
                : `${BASE}${user.profile_image}`;
            imgEl.src = src;
            imgEl.onerror = () => { imgEl.src = fallbackSrc; };
        } else {
            imgEl.src = fallbackSrc;
        }

        // Style the avatar nicely
        imgEl.style.cssText += "width:40px;height:40px;border-radius:50%;object-fit:cover;cursor:pointer;border:2px solid #e0e5f2;transition:border-color 0.2s;";
        imgEl.addEventListener("mouseenter", () => { imgEl.style.borderColor = "#4318ff"; });
        imgEl.addEventListener("mouseleave", () => { imgEl.style.borderColor = "#e0e5f2"; });
    }

    // Run on DOMContentLoaded or immediately if already loaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            loadNavProfile();
            checkNotifications();
        });
    } else {
        loadNavProfile();
        checkNotifications();
    }
})();

async function checkNotifications() {
    const bellBtn = document.getElementById("notificationBtn") || document.querySelector(".icon-btn");
    if (!bellBtn) return;

    let dot = bellBtn.querySelector(".notification-dot") || document.getElementById("notificationDot");
    if (!dot) {
        dot = document.createElement("span");
        dot.className = "notification-dot";
        dot.id = "notificationDot";
        bellBtn.style.position = "relative";
        bellBtn.appendChild(dot);
    }

    bellBtn.addEventListener("click", () => {
        dot.style.display = "none";
        localStorage.setItem("notifications_read", "true");
        // Navigate to applications page
        if (!window.location.pathname.includes("my_applications.html")) {
            window.location.href = "my_applications.html";
        }
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    // Check if user already read notifications in this "cycle"
    if (localStorage.getItem("notifications_read") === "true") {
        dot.style.display = "none";
        return;
    }

    try {
        const BASE = window.API_BASE_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${BASE}/applications/user/${user.id}`);
        if (response.ok) {
            const apps = await response.json();
            // Show badge if ANY status is not 'Applied' (simulating an update)
            const hasUpdate = apps.some(app => app.status !== 'Applied');

            if (hasUpdate) {
                dot.style.display = "block";
                bellBtn.title = "You have updates on your applications!";
            } else {
                dot.style.display = "none";
            }
        }
    } catch (err) {
        console.error("Notification check failed:", err);
    }
}
/**
 * Mobile Sidebar Toggle
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (sidebar && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});
