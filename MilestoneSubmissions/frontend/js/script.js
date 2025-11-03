// Redirect to login if user is not logged in
if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

// Sample Data
const dailyLeaders = [
  { rank: 1, name: "Sarah M.", saved: 45.2, avatar: "SM" },
  { rank: 2, name: "Alex K.", saved: 38.75, avatar: "AK" },
  { rank: 3, name: "Jordan P.", saved: 32.5, avatar: "JP" },
];

const posts = [
  {
    id: 1,
    user: "Emily Chen",
    avatar: "EC",
    time: "2 hours ago",
    amount: 12.5,
    category: "Coffee",
    description: "Morning latte at my favorite cafe ☕",
    reactions: 24,
  },
  {
    id: 2,
    user: "Marcus Rodriguez",
    avatar: "MR",
    time: "4 hours ago",
    amount: 45.0,
    category: "Groceries",
    description: "Weekly grocery haul 🛒",
    reactions: 18,
  },
  {
    id: 3,
    user: "Priya Sharma",
    avatar: "PS",
    time: "5 hours ago",
    amount: 89.99,
    category: "Fitness",
    description: "New running shoes! Time to hit my goals 👟",
    reactions: 32,
  },
  {
    id: 4,
    user: "David Kim",
    avatar: "DK",
    time: "7 hours ago",
    amount: 25.0,
    category: "Transport",
    description: "Uber to the airport ✈️",
    reactions: 12,
  },
];

document.addEventListener("DOMContentLoaded", () => {
  renderLeaders();
  updateProgressBar();
  renderPosts();
});

// Render Daily Leaders safely
function renderLeaders() {
  const leadersList = document.getElementById("leadersList");
  if (!leadersList) return;

  // Clear old elements without destroying parent node
  leadersList.replaceChildren();

  dailyLeaders.forEach((leader) => {
    const leaderHTML = `
      <div class="leader-item">
        <div class="leader-info">
          <div class="leader-avatar rank-${leader.rank}">
            ${leader.avatar}
          </div>
          <div class="leader-details">
            <h3>${leader.name}</h3>
            <p>Saved $${leader.saved.toFixed(2)}</p>
          </div>
        </div>
        <span class="leader-medal">
          ${leader.rank === 1 ? "🥇" : leader.rank === 2 ? "🥈" : "🥉"}
        </span>
      </div>
    `;
    leadersList.insertAdjacentHTML("beforeend", leaderHTML);
  });
}

// Update Progress Bar
function updateProgressBar() {
  const dailyGoal = 100;
  const currentSpending = 67.5;
  const percentage = (currentSpending / dailyGoal) * 100;

  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;

  progressBar.style.width = `${Math.min(percentage, 100)}%`;

  if (percentage > 90) {
    progressBar.style.background = "#ef4444";
  } else if (percentage > 70) {
    progressBar.style.background = "#f59e0b";
  } else {
    progressBar.style.background = "#10b981";
  }
}

// Render Posts safely
function renderPosts() {
  const postsContainer = document.getElementById("postsContainer");
  if (!postsContainer) return;

  // Clear existing posts without nuking the parent node
  postsContainer.replaceChildren();

  posts.forEach((post) => {
    const postHTML = `
      <div class="post-card">
        <div class="post-header">
          <div class="post-user">
            <div class="post-avatar">${post.avatar}</div>
            <div class="post-user-info">
              <h3>${post.user}</h3>
              <p>${post.time}</p>
            </div>
          </div>
          <div class="post-amount">
            <div class="post-price">$${post.amount.toFixed(2)}</div>
            <span class="post-category">${post.category}</span>
          </div>
        </div>
        <p class="post-description">${post.description}</p>
        <div class="post-actions">
          <button class="post-action">
            <span>❤️</span>
            <span>${post.reactions}</span>
          </button>
          <button class="post-action">Comment</button>
          <button class="post-action">Share</button>
        </div>
      </div>
    `;
    postsContainer.insertAdjacentHTML("beforeend", postHTML);
  });
}
