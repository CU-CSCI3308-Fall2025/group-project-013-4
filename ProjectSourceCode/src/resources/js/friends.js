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










