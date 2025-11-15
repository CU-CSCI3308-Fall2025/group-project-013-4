// auth.js — login, register, session enforcement

// Validate email
window.isValidEmail = function (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const usernameVal = document.getElementById("username").value.trim();
      const emailVal = document.getElementById("email").value.trim();
      const passwordVal = document.getElementById("password").value.trim();

      if (!window.isValidEmail(emailVal)) {
        alert("Please enter a valid email.");
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameVal,
          email: emailVal,
          password: passwordVal
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
      } else {
        alert(data.message || data.error || "Registration failed");
      }
    });
  }

  /* --------------------------- LOGIN --------------------------- */
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // ✅ Correct element references
      const emailEl = document.getElementById("email");
      const passwordEl = document.getElementById("password");

      const emailVal = emailEl.value.trim();
      const passwordVal = passwordEl.value.trim();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailVal,
          password: passwordVal
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
      } else {
        alert(data.error || "Invalid credentials");
      }
    });
  }

  /* ---------------------- REDIRECT / SESSION ENFORCEMENT ---------------------- */
  const path = window.location.pathname;
  const token = window.API.getToken();

  if (token) {
    if (window.API.isTokenExpired(token)) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else if (path === "/login" || path === "/register") {
      window.location.href = "/";
    }
  } else if (path === "/" || path === "/home") {
    window.location.href = "/login";
  }
});
