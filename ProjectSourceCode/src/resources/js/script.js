// --- WalletWatch Client Logic --- //

const API_BASE = '/api/auth';

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    console.error('Unable to decode token', error);
    return true;
  }
}

// ✅ Utility: Validate Email Format
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ✅ Live email validation feedback (used on register page)
const emailInput = document.getElementById('email');
if (emailInput) {
  emailInput.addEventListener('input', event => {
    const error = document.getElementById('emailError');
    if (!error) {
      return;
    }

    const value = event.target.value.trim();

    if (value === '') {
      error.textContent = '';
      emailInput.classList.remove('valid', 'invalid');
      return;
    }

    if (!isValidEmail(value)) {
      error.textContent = 'Please enter a valid email address.';
      emailInput.classList.add('invalid');
      emailInput.classList.remove('valid');
    } else {
      error.textContent = '✓ Looks good!';
      emailInput.classList.add('valid');
      emailInput.classList.remove('invalid');
    }
  });
}

// 🔹 Handle Registration
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async event => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!isValidEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        alert('🎉 Registration successful! Redirecting...');
        window.location.href = '/';
      } else {
        alert(`⚠️ ${data.error || data.message || 'Registration failed'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong while registering. Try again later.');
    }
  });
}

// 🔹 Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        alert('✅ Login successful! Redirecting...');
        window.location.href = '/';
      } else {
        alert(`⚠️ ${data.error || data.message || 'Invalid credentials'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong while logging in. Try again later.');
    }
  });
}

// 🔹 Optional: Auto Redirect if Already Logged In
const currentPath = window.location.pathname;
const storedToken = localStorage.getItem('token');

if (storedToken) {
  if (isTokenExpired(storedToken)) {
    localStorage.removeItem('token');
    alert('Session expired. Please log in again.');
    window.location.href = '/login';
  } else if (currentPath === '/login' || currentPath === '/register') {
    window.location.href = '/';
  }
} else if (currentPath === '/' || currentPath === '/home') {
  window.location.href = '/login';
}

// Sample Data
const dailyLeaders = [
  { rank: 1, name: 'Sarah M.', saved: 45.2, avatar: 'SM' },
  { rank: 2, name: 'Alex K.', saved: 38.75, avatar: 'AK' },
  { rank: 3, name: 'Jordan P.', saved: 32.5, avatar: 'JP' }
];

const posts = [
  {
    id: 1,
    user: 'Emily Chen',
    avatar: 'EC',
    time: '2 hours ago',
    amount: 12.5,
    category: 'Coffee',
    description: 'Morning latte at my favorite cafe ☕',
    reactions: 24
  },
  {
    id: 2,
    user: 'Marcus Rodriguez',
    avatar: 'MR',
    time: '4 hours ago',
    amount: 45.0,
    category: 'Groceries',
    description: 'Weekly grocery haul 🛒',
    reactions: 18
  },
  {
    id: 3,
    user: 'Priya Sharma',
    avatar: 'PS',
    time: '5 hours ago',
    amount: 89.99,
    category: 'Fitness',
    description: 'New running shoes! Time to hit my goals 👟',
    reactions: 32
  },
  {
    id: 4,
    user: 'David Kim',
    avatar: 'DK',
    time: '7 hours ago',
    amount: 25.0,
    category: 'Transport',
    description: 'Uber to the airport ✈️',
    reactions: 12
  }
];

document.addEventListener('DOMContentLoaded', () => {
  renderLeaders();
  renderPosts();

  const progressBar = document.getElementById('progressBar');
  if (progressBar) updateProgressBar();
});


const logoutBtn = document.getElementById('logoutBtn');
const profileDropdown = document.getElementById('profileDropdown');
const profileMenu = document.getElementById('profileMenu');

if (logoutBtn) {
  logoutBtn.addEventListener('click', event => {
    event.preventDefault();
    if (profileMenu) {
      profileMenu.classList.remove('show');
    }
    localStorage.removeItem('token');
    window.location.href = '/logout';
  });
}

if (profileDropdown && profileMenu) {
  profileDropdown.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    profileMenu.classList.toggle('show');
  });

  document.addEventListener('click', event => {
    if (!profileDropdown.contains(event.target) && !profileMenu.contains(event.target)) {
      profileMenu.classList.remove('show');
    }
  });

  ['hide.bs.dropdown', 'click.bs.dropdown.data-api'].forEach(eventName => {
    [profileDropdown, profileMenu].forEach(element => {
      element.addEventListener(eventName, event => event.stopImmediatePropagation());
    });
  });
}

// Render Daily Leaders safely
function renderLeaders() {
  const leadersList = document.getElementById('leadersList');
  if (!leadersList) return;

  leadersList.replaceChildren();

  dailyLeaders.forEach(leader => {
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
          ${leader.rank === 1 ? '🥇' : leader.rank === 2 ? '🥈' : '🥉'}
        </span>
      </div>
    `;
    leadersList.insertAdjacentHTML('beforeend', leaderHTML);
  });
}

// Update Progress Bar
function updateProgressBar() {
  const dailyGoal = 100;
  const currentSpending = 67.5;
  const percentage = (currentSpending / dailyGoal) * 100;

  const progressBar = document.getElementById('progressBar');
  if (!progressBar) return;

  progressBar.style.width = `${Math.min(percentage, 100)}%`;

  if (percentage > 90) {
    progressBar.style.background = '#ef4444';
  } else if (percentage > 70) {
    progressBar.style.background = '#f59e0b';
  } else {
    progressBar.style.background = '#10b981';
  }
}

// Render Posts safely
function renderPosts() {
  const postsContainer = document.getElementById('postsContainer');
  if (!postsContainer) return;

  postsContainer.replaceChildren();

  posts.forEach(post => {
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
    postsContainer.insertAdjacentHTML('beforeend', postHTML);
  });
}



//friends system
document.addEventListener('DOMContentLoaded', () => {
const main = document.querySelector('main.friends-container');
  if (main) {
    renderFriends();
    renderPendingRequests();
    setupSearch();
  }
});
// --- Render functions ---
async function renderFriends() {
  const friendsList = document.getElementById('friendsList');
  if (!friendsList) return;

  const friends = await listFriends() || [];
  friendsList.innerHTML = '';
  if (!friends.length) {
    friendsList.textContent = "You don't have any friends yet! Send a request to get started.";
    return;
  }

  friends.forEach(friend => {
    const div = document.createElement('div');
    div.classList.add('friend-item');

    // Friend name
    const nameSpan = document.createElement('span');
    nameSpan.textContent = friend.username;
    div.appendChild(nameSpan);

    // Three-dot button (hidden until hover)
    const dotsBtn = document.createElement('button');
    dotsBtn.textContent = '⋮';
    dotsBtn.classList.add('dots-btn');
    div.appendChild(dotsBtn);

    // Actions menu (hidden by default)
    const actionsMenu = document.createElement('div');
    actionsMenu.classList.add('friend-actions-menu');
    actionsMenu.style.display = 'none';

    // View Profile
    const viewProfileOption = document.createElement('div');
    viewProfileOption.textContent = 'View profile';
    viewProfileOption.classList.add('menu-item');
    viewProfileOption.addEventListener('click', () => {
      actionsMenu.style.display = 'none';
      //add functionality for this later after we have a profiles page?
    });
    actionsMenu.appendChild(viewProfileOption);

    // Remove Friend
    const rmFriendOption = document.createElement('div');
    rmFriendOption.textContent = 'Remove friend';
    rmFriendOption.classList.add('menu-item');
    rmFriendOption.addEventListener('click', async () => {
      if (confirm(`Remove ${friend.username} from friends?`)) {
        await removeFriend(friend.id);
        div.remove();
      }
      actionsMenu.style.display = 'none';
    });
    actionsMenu.appendChild(rmFriendOption);

    div.appendChild(actionsMenu);

    // Click on dots button toggles menu
    dotsBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent document click from closing immediately
      actionsMenu.style.display = actionsMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close menu if clicking outside
    document.addEventListener('click', () => {
      actionsMenu.style.display = 'none';
    });

    friendsList.appendChild(div);
  });
}


async function renderPendingRequests() {
  const pendingList = document.getElementById('pendingList');
  if (!pendingList) return;
  
  const requests = await listPendingRequests() || [];
  pendingList.innerHTML = '';
  if (!requests.length) {
    pendingList.textContent = 'No pending friend requests.';
    return;
  }

requests.forEach(req => {
  const div = document.createElement('div');
  div.classList.add('pending-item');

  const usernameSpan = document.createElement('span');
  usernameSpan.textContent = req.username;
  div.appendChild(usernameSpan);

  // Button container (side by side)
  const btnContainer = document.createElement('div');
  btnContainer.classList.add('pending-buttons');

  // Accept button
  const acceptBtn = document.createElement('button');
  acceptBtn.textContent = 'Accept';
  acceptBtn.classList.add('btn-small', 'btn-accept');
  acceptBtn.addEventListener('click', async () => {
    await acceptFriendRequest(req.sender_id);
    await renderFriends();
    await renderPendingRequests();
  });

  // Decline button
  const declineBtn = document.createElement('button');
  declineBtn.textContent = 'Decline';
  declineBtn.classList.add('btn-small', 'btn-decline');
  declineBtn.addEventListener('click', async () => {
    await declineFriendRequest(req.sender_id);
    await renderPendingRequests();
  });

  // Add buttons to container
  btnContainer.append(acceptBtn, declineBtn);
  div.appendChild(btnContainer);

  pendingList.appendChild(div);
});
} //working and styled

// --- API calls ---
async function sendFriendRequest(recipientId) {
  return fetch('/api/friends/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientId: recipientId })
  })
  .then(res => res.json())
  .catch(console.error);
} //verified working

async function acceptFriendRequest(senderId) {
  return fetch('/api/friends/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId: senderId })
  })
    .then(res => res.json())
    .catch(console.error);
} //working

async function declineFriendRequest(senderId) {
  try {
    const res = await fetch('/api/friends/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to decline friend request.');
    }

    return data; // {message: 'Friend request declined.'}
  } catch (err) {
    console.error('Decline request error:', err);
  }
} //verified working

async function listFriends() {
  try {
    const res = await fetch('/api/friends');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
} //verified working

async function listPendingRequests() {
  try {
    const res = await fetch('/api/friends/pending');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
} //verified working

async function searchUsers(query) {
  try {
    const res = await fetch(`/api/friends/search?query=${encodeURIComponent(query)}`, {
    headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
  });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
} //add styling

async function removeFriend(friendId){
  if (!friendId) {
    console.error('No friendId provided.');
    return;
  }

  try {
    const res = await fetch('/api/friends/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to remove friend.');
    }

    console.log(data.message);
    await renderFriends();
  } catch (err) {
    console.error('Remove friend error:', err);
    alert(err.message || 'Error removing friend.');
  }
}

// --- Search setup ---
function setupSearch() {
const form = document.getElementById('friendSearchForm');
const searchInput = document.getElementById('friendSearch');
const resultsList = document.getElementById('searchResults');

if (!form || !searchInput || !resultsList) return;

form.addEventListener('submit', (e) => e.preventDefault());

if (searchInput && resultsList) {
  let searchTimeout;

  searchInput.addEventListener('input', async () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();

    searchTimeout = setTimeout(async () => {
      resultsList.innerHTML = '';
      if (!query) return;

      try {
        const users = await searchUsers(query);
        if (!users || users.length === 0) {
          resultsList.textContent = 'No users found.';
          return;
        }

        users.forEach(user => {
          const div = document.createElement('div');
          div.classList.add('search-result');
          div.textContent = user.username;

          const addBtn = document.createElement('button');
          addBtn.classList.add('btn-small', 'btn-accept');
          addBtn.style.marginLeft = '8px';
          addBtn.textContent = 'Add';
          addBtn.addEventListener('click', async () => {
            await sendFriendRequest(user.id);
            div.remove();
            await renderPendingRequests();
          });

          div.appendChild(addBtn);
          resultsList.appendChild(div);
        });
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  });
}
} //working










