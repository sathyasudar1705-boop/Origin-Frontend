/**
 * Handles profile image/logo uploads to the Cloudinary backend
 * @param {File} file - The file to upload
 * @param {string} type - 'user' or 'company'
 * @returns {Promise<string>} - The uploaded image URL
 */
async function uploadImage(file, type) {
    console.log(`Starting ${type} image upload to Cloudinary...`);
    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "user_login.html";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const endpoint = type === "user"
        ? "/api/users/upload-profile-image"
        : "/api/companies/upload-logo";

    const baseUrl = window.API_BASE_URL || "http://127.0.0.1:8000";

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Upload Success:", data);
            return data.image_url;
        } else {
            const error = await response.json().catch(() => ({ detail: "Upload failed" }));
            console.error("Upload Failed Response:", error);
            throw new Error(error.detail || "Upload failed");
        }
    } catch (err) {
        console.error("Upload Network/System Error:", err);
        throw err;
    }
}

/**
 * Initializes image upload UI components
 * @param {string} containerId - ID of the container element
 * @param {string} previewId - ID of the image element for preview
 * @param {string} type - 'user' or 'company'
 */
function initUploadUI(containerId, previewId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="upload-section">
            <input type="file" id="imageInput" accept="image/*" style="display: none;">
            <button type="button" class="btn-secondary" id="selectBtn">Select Image</button>
            <button type="button" class="btn-primary" id="uploadBtn" disabled>Upload</button>
            <div id="uploadStatus" style="margin-top: 10px; font-size: 14px;"></div>
        </div>
    `;

    const input = container.querySelector("#imageInput");
    const selectBtn = container.querySelector("#selectBtn");
    const uploadBtn = container.querySelector("#uploadBtn");
    const status = container.querySelector("#uploadStatus");
    const preview = document.getElementById(previewId);

    selectBtn.onclick = () => input.click();

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Preview
            const reader = new FileReader();
            reader.onload = (event) => {
                if (preview) preview.src = event.target.result;
            };
            reader.readAsDataURL(file);
            uploadBtn.disabled = false;
        }
    };

    uploadBtn.onclick = async () => {
        const file = input.files[0];
        if (!file) return;

        uploadBtn.disabled = true;
        selectBtn.disabled = true;
        status.textContent = "Uploading...";
        status.style.color = "blue";

        try {
            const imageUrl = await uploadImage(file, type);
            status.textContent = "✅ Upload Successful!";
            status.style.color = "green";

            // Update local storage user object
            const user = JSON.parse(localStorage.getItem("user"));
            if (type === "user") {
                user.profile_image = imageUrl;
            } else {
                if (user.company) user.company.logo = imageUrl;
            }
            localStorage.setItem("user", JSON.stringify(user));

            if (preview) preview.src = imageUrl;
        } catch (err) {
            status.textContent = "❌ Error: " + err.message;
            status.style.color = "red";
            uploadBtn.disabled = false;
        } finally {
            selectBtn.disabled = false;
        }
    };
}
