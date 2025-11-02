document.addEventListener("DOMContentLoaded", () => {
  // --- Profile dropdown toggle ---
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

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navItems = document.querySelectorAll(".nav-menu a.nav-item");

    navItems.forEach((item) => {
        const href = item.getAttribute("href");

        // ✅ Only mark pages that actually have an HTML file link
        if (href && href.endsWith(".html") && href === currentPage) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

});
