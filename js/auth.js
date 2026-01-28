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
            alert("Registration Successful! Please Login.");
            window.location.href = "user_login.html";
        } else {
            const error = await response.json();
            alert("Registration Failed: " + (error.detail || "Error occurred"));
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Server connection error: " + API_BASE_URL);
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
            const user = await response.json();
            localStorage.setItem("user", JSON.stringify(user));
            alert("Company Registered Successfully!");
            window.location.href = "company_dashboard.html";
        } else {
            const error = await response.json();
            alert("Registration Failed: " + (error.detail || "Error occurred"));
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Server connection error: " + API_BASE_URL);
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
            const user = await response.json();
            console.log("Login success, user role:", user.role);

            if (requiredRole && user.role !== requiredRole) {
                alert(`Access Denied: This account is a ${user.role}.`);
                if (btn) { btn.innerText = originalText; btn.disabled = false; }
                return;
            }

            localStorage.setItem("user", JSON.stringify(user));
            alert("Login Successful!");
            window.location.href = user.role === "employer" ? "company_dashboard.html" : "dashboard.html";
        } else {
            const error = await response.json().catch(() => ({ detail: "Invalid email or password" }));
            alert("Login Failed: " + (error.detail || "Invalid credentials"));
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Connection Failed: Ensure your backend is running at " + API_BASE_URL);
    } finally {
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}
