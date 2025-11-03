// authGuard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  // If there's no token, redirect to login
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Optionally: verify token expiration on client side
  const payload = JSON.parse(atob(token.split(".")[1]));
  const isExpired = Date.now() >= payload.exp * 1000;

  if (isExpired) {
    localStorage.removeItem("token");
    alert("Session expired. Please log in again.");
    window.location.href = "login.html";
  }
});
