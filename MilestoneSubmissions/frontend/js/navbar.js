document.addEventListener("DOMContentLoaded", () => {
  // --- PROFILE DROPDOWN TOGGLE ---
  const profileDropdown = document.getElementById("profileDropdown");
  const profileMenu = document.getElementById("profileMenu");

  if (profileDropdown && profileMenu) {
    profileDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove("show");
      }
    });
  }

  // --- ACTIVE PAGE HIGHLIGHT ---
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navItems = document.querySelectorAll(".nav-menu a.nav-item");

  navItems.forEach((item) => {
    const href = item.getAttribute("href");
    if (href && href.endsWith(".html") && href === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // --- LOGOUT FUNCTIONALITY ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Clear token and close dropdown
      localStorage.removeItem("token");
      if (profileMenu) profileMenu.classList.remove("show");

      console.log("✅ Logged out successfully");
      window.location.href = "login.html";
    });
  }
});

// --- PREVENT BOOTSTRAP INTERFERENCE ---
document.querySelectorAll("#profileDropdown, #profileMenu").forEach((el) => {
  el.addEventListener("hide.bs.dropdown", (e) => e.stopImmediatePropagation());
  el.addEventListener("click.bs.dropdown.data-api", (e) => e.stopImmediatePropagation());
});
