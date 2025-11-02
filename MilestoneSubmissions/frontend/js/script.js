// Redirect to login if user is not logged in
if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

// Sample Data
const dailyLeaders = [
    { rank: 1, name: "Sarah M.", saved: 45.20, avatar: "SM" },
    { rank: 2, name: "Alex K.", saved: 38.75, avatar: "AK" },
    { rank: 3, name: "Jordan P.", saved: 32.50, avatar: "JP" }
];

const posts = [
    {
        id: 1,
        user: "Emily Chen",
        avatar: "EC",
        time: "2 hours ago",
        amount: 12.50,
        category: "Coffee",
        description: "Morning latte at my favorite cafe ☕",
        reactions: 24
    },
    {
        id: 2,
        user: "Marcus Rodriguez",
        avatar: "MR",
        time: "4 hours ago",
        amount: 45.00,
        category: "Groceries",
        description: "Weekly grocery haul 🛒",
        reactions: 18
    },
    {
        id: 3,
        user: "Priya Sharma",
        avatar: "PS",
        time: "5 hours ago",
        amount: 89.99,
        category: "Fitness",
        description: "New running shoes! Time to hit my goals 👟",
        reactions: 32
    },
    {
        id: 4,
        user: "David Kim",
        avatar: "DK",
        time: "7 hours ago",
        amount: 25.00,
        category: "Transport",
        description: "Uber to the airport ✈️",
        reactions: 12
    }
];

// Profile Dropdown Toggle
const profileDropdown = document.getElementById('profileDropdown');
const profileMenu = document.getElementById('profileMenu');

profileDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove('show');
    }
});

// Render Daily Leaders
function renderLeaders() {
    const leadersList = document.getElementById('leadersList');
    leadersList.innerHTML = dailyLeaders.map(leader => `
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
            <span class="leader-medal">${leader.rank === 1 ? '🥇' : leader.rank === 2 ? '🥈' : '🥉'}</span>
        </div>
    `).join('');
}

// Update Progress Bar
function updateProgressBar() {
    const dailyGoal = 100;
    const currentSpending = 67.50;
    const percentage = (currentSpending / dailyGoal) * 100;
    
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${Math.min(percentage, 100)}%`;
    
    if (percentage > 90) {
        progressBar.style.background = '#ef4444';
    } else if (percentage > 70) {
        progressBar.style.background = '#f59e0b';
    } else {
        progressBar.style.background = '#10b981';
    }
}

// Render Posts
function renderPosts() {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = posts.map(post => `
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
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderLeaders();
    updateProgressBar();
    renderPosts();
});

