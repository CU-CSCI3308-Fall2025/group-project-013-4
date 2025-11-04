// --- Auth Form Logic for WalletWatch --- //

const API_BASE = "http://localhost:5001/api/auth";

// ✅ Utility: Validate Email Format
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ✅ Live email validation feedback
const emailInput = document.getElementById("email");
if (emailInput) {
  emailInput.addEventListener("input", (e) => {
    const error = document.getElementById("emailError");
    const value = e.target.value.trim();

    if (value === "") {
      error.textContent = "";
      emailInput.classList.remove("valid", "invalid");
      return;
    }

    if (!isValidEmail(value)) {
      error.textContent = "Please enter a valid email address.";
      emailInput.classList.add("invalid");
      emailInput.classList.remove("valid");
    } else {
      error.textContent = "✓ Looks good!";
      emailInput.classList.add("valid");
      emailInput.classList.remove("invalid");
    }
  });
}

// 🔹 Handle Registration
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validate email before sending to backend
    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save token and redirect to home
        localStorage.setItem("token", data.token);
        alert("🎉 Registration successful! Redirecting...");
        window.location.href = "index.html";
      } else {
        alert(`⚠️ ${data.error || "Registration failed"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while registering. Try again later.");
    }
  });
}

// 🔹 Handle Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save token and redirect to home
        localStorage.setItem("token", data.token);
        alert("✅ Login successful! Redirecting...");
        window.location.href = "index.html";
      } else {
        alert(`⚠️ ${data.error || "Invalid credentials"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while logging in. Try again later.");
    }
  });
}

// 🔹 Optional: Auto Redirect if Already Logged In
if (localStorage.getItem("token")) {
  const path = window.location.pathname;
  if (path.includes("login.html") || path.includes("register.html")) {
    window.location.href = "index.html";
  }
}
