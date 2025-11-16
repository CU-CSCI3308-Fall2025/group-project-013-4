// ui.js — general UI logic

document.addEventListener("DOMContentLoaded", () => {
  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/logout";
    });
  }

  // Profile dropdown
  const dropdown = document.getElementById("profileDropdown");
  const menu = document.getElementById("profileMenu");

  if (dropdown && menu) {
    dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  }
});

// ------------------------------------
// LEADERBOARD
// ------------------------------------

// 🔥 Define this FIRST so renderLeaders sees it
window.dailyLeaders = [
  { rank: 1, name: "Sarah M.", saved: 45.2, avatar: "SM" },
  { rank: 2, name: "Alex K.", saved: 38.75, avatar: "AK" },
  { rank: 3, name: "Jordan P.", saved: 32.5, avatar: "JP" }
];

window.renderLeaders = function () {
  const container = document.getElementById("leadersList");
  if (!container) return;

  container.innerHTML = "";
  window.dailyLeaders.forEach((leader) => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="leader-item">
        <div class="leader-info">
          <div class="leader-avatar rank-${leader.rank}">${leader.avatar}</div>
          <div>
            <h3>${leader.name}</h3>
            <p>$${leader.saved.toFixed(2)}</p>
          </div>
        </div>
        <span>${leader.rank === 1 ? "🥇" : leader.rank === 2 ? "🥈" : "🥉"}</span>
      </div>
      `
    );
  });
};

// ------------------------------------
// PROGRESS BAR
// ------------------------------------

window.updateProgressBar = function () {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;

  const dailyGoal = 100;
  const spent = 67.5;
  const percent = (spent / dailyGoal) * 100;

  progressBar.style.width = `${percent}%`;
};
