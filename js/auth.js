console.log("auth.js loaded");

// Register Function
async function registerUser(event) {
    if (event) event.preventDefault();
    console.log("Registering user...");
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role") ? document.getElementById("role").value : "job seeker";

    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ full_name: fullName, email, password, role: role.replace("_", " ") }) // Ensure space
        });

        if (response.ok) {
            console.log("Registration Successful! Please Login.");
            window.location.href = "user_login.html";
        } else {
            const error = await response.json().catch(() => ({ detail: "Unknown error" }));
            console.error("Registration Failed:", error);
            console.log("Registration Failed: " + (error.detail || "Error occurred"));
        }
    } catch (err) {
        console.error("Error:", err);
        console.log("Server connection error: " + API_BASE_URL + "\nPlease check if the backend is running.");
    }
}

// Company Register Function
async function registerCompany(event) {
    if (event) event.preventDefault();
    console.log("Registering company...");
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const companyName = document.getElementById("companyName").value;
    const location = document.getElementById("companyLocation").value;

    try {
        const response = await fetch(`${API_BASE_URL}/companies/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: fullName,
                email,
                password,
                company_name: companyName,
                location: location
            })
        });

        if (response.ok) {
            console.log("Company Registered Successfully! Please Login.");
            window.location.href = "company_login.html"; // Fixed redirect
        } else {
            const error = await response.json().catch(() => ({ detail: "Unknown error" }));
            console.error("Company Registration Failed:", error);
            console.log("Registration Failed: " + (error.detail || "Error occurred"));
        }
    } catch (err) {
        console.error("Error:", err);
        console.log("Server connection error: " + API_BASE_URL + "\nPlease check if the backend is running.");
    }
}

// Login Function
async function loginUser(event, requiredRole) {
    console.log("loginUser function CALLED");
    if (event) event.preventDefault();

    // Find the button for visual feedback
    const btn = document.querySelector(".auth-btn") || (event && event.submitter);
    const originalText = btn ? btn.innerText : "Login";

    if (btn) {
        btn.innerText = "Connecting...";
        btn.disabled = true;
    }

    try {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        console.log(`Attempting login: ${email} to ${API_BASE_URL}`);

        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        console.log("Response received:", response.status);

        if (response.ok) {
            const data = await response.json();
            const user = data.user || data; // Handle both old and new formats for safety
            console.log("Login success, user role:", user.role);

            if (requiredRole && user.role !== requiredRole) {
                console.log(`Access Denied: This account is a ${user.role}.`);
                if (btn) { btn.innerText = originalText; btn.disabled = false; }
                return;
            }

            localStorage.setItem("user", JSON.stringify(user));
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
            }
            console.log("Login Successful!");
            window.location.href = user.role === "employer" ? "company_dashboard.html" : "dashboard.html";
        } else {
            const error = await response.json().catch(() => ({ detail: "Invalid email or password" }));
            console.log("Login Failed: " + (error.detail || "Invalid credentials"));
        }
    } catch (err) {
        console.error("Login Error:", err);
        console.log("Connection Failed: Ensure your backend is running at " + API_BASE_URL);
    } finally {
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}
