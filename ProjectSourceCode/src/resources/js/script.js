// --- WalletWatch Client Logic --- //

const API_BASE = '/api/auth';
let currentUserId = null;
let editingPostId = null;
let editingPostImageUrl = null;

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    console.error('Unable to decode token', error);
    return true;
  }
}

// Validate Email Format
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/* --------------------------- EMAIL LIVE VALIDATION -------------------------- */

const emailInput = document.getElementById('email');
if (emailInput) {
  emailInput.addEventListener('input', event => {
    const error = document.getElementById('emailError');
    if (!error) return;

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

/* ------------------------------ REGISTER LOGIC ------------------------------ */

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

/* -------------------------------- LOGIN LOGIC ------------------------------- */

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

/* ------------------------------ AUTH REDIRECTS ------------------------------ */

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

/* ---------------------------- LEADERBOARD RENDER ---------------------------- */

const dailyLeaders = [
  { rank: 1, name: 'Sarah M.', saved: 45.2, avatar: 'SM' },
  { rank: 2, name: 'Alex K.', saved: 38.75, avatar: 'AK' },
  { rank: 3, name: 'Jordan P.', saved: 32.5, avatar: 'JP' }
];

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

/* ----------------------------- PROGRESS BAR UI ------------------------------ */

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

/* ----------------------------- POSTS (REAL DATA) ---------------------------- */

// Load posts when page loads
async function loadPosts() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/posts', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Unable to fetch posts');
    }

    const posts = await res.json();
    renderPostsFromDB(posts);
  } catch (error) {
    console.error('Unable to load posts:', error);
  }
}

function renderPostsFromDB(posts) {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  if (!Array.isArray(posts) || posts.length === 0) {
    container.innerHTML = '<p class="text-muted">No posts yet. Be the first to share!</p>';
    return;
  }

  const markup = posts.map(post => buildPostHTML(post)).join('');
  container.innerHTML = markup;
}

function buildPostHTML(post) {
  if (!post) return '';

  const profileImage = post.profile_picture || '/resources/img/PFP_Default.jpeg';
  const username = post.username || (post.user_id === currentUserId ? 'You' : 'WalletWatch member');
  const createdAt = post.created_at ? new Date(post.created_at).toLocaleString() : '';
  const hasAmount = typeof post.amount !== 'undefined' && post.amount !== null && post.amount !== '';
  const amountValue = hasAmount ? `$${Number(post.amount).toFixed(2)}` : '';
  const categoryLabel = post.category || '';
  const description = post.description || '';
  const imageMarkup = post.image_url
    ? `<img src="${post.image_url}" alt="Post attachment" class="post-image" loading="lazy" data-full-image="${post.image_url}" />`
    : '';
  const showAmountSection = amountValue || categoryLabel;
  const serializedPost = encodeURIComponent(
    JSON.stringify({
      id: post.id,
      amount: post.amount,
      category: post.category,
      description: post.description,
      image_url: post.image_url
    })
  );
  const canEdit = Number(post.user_id) === Number(currentUserId);

  return `
    <div class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <div class="post-user">
          <img src="${profileImage}" class="post-avatar-img" alt="${username}'s avatar"/>
          <div class="post-user-info">
            <h3>${username}</h3>
            <p>${createdAt}</p>
          </div>
        </div>
        ${
          showAmountSection
            ? `<div class="post-amount">
                ${amountValue ? `<div class="post-price">${amountValue}</div>` : ''}
                ${categoryLabel ? `<span class="post-category">${categoryLabel}</span>` : ''}
              </div>`
            : ''
        }
      </div>
      ${description ? `<p class="post-description">${description}</p>` : ''}
      ${imageMarkup}
      ${
        canEdit
          ? `<div class="post-actions">
              <button type="button" class="post-action post-edit-btn" data-post="${serializedPost}">
                ✏️ Edit
              </button>
              <button type="button" class="post-action delete post-delete-btn" data-post-id="${post.id}">
                🗑 Delete
              </button>
            </div>`
          : ''
      }
    </div>
  `;
}

/* ----------------------------- ADD POST (FORM) ----------------------------- */

const addPostForm = document.getElementById('addPostForm');
const postModalEl = document.getElementById('addPostModal');
const postModalTitle = document.getElementById('postModalTitle');
const postImageInput = document.getElementById('postImage');
const triggerImageUploadBtn = document.getElementById('triggerImageUpload');
const postImageFilename = document.getElementById('postImageFilename');
const postsContainer = document.getElementById('postsContainer');
const imagePreviewModalEl = document.getElementById('imagePreviewModal');
const imagePreviewEl = document.getElementById('imagePreview');

if (triggerImageUploadBtn && postImageInput) {
  triggerImageUploadBtn.addEventListener('click', () => postImageInput.click());
}

if (postImageInput) {
  postImageInput.addEventListener('change', () => updateImageFileName());
}

if (addPostForm) {
  addPostForm.addEventListener('submit', async event => {
    event.preventDefault();
    await submitPostForm();
  });
}

if (postModalEl && window.bootstrap) {
  postModalEl.addEventListener('hidden.bs.modal', () => {
    resetPostForm();
  });
}

if (postsContainer) {
  postsContainer.addEventListener('click', event => {
    const imageEl = event.target.closest('.post-image');
    if (imageEl) {
      showImagePreview(imageEl.dataset.fullImage || imageEl.src, imageEl.alt);
      return;
    }

    const editBtn = event.target.closest('.post-edit-btn');
    const deleteBtn = event.target.closest('.post-delete-btn');

    if (editBtn) {
      const payload = editBtn.dataset.post;
      const parsed = parsePostPayload(payload);
      if (parsed) {
        populatePostForm(parsed);
      }
      return;
    }

    if (deleteBtn) {
      const postId = deleteBtn.dataset.postId;
      handleDeletePost(postId);
    }
  });
}

function showImagePreview(imageUrl, altText = 'Post image') {
  if (!imageUrl) return;

  if (imagePreviewEl) {
    imagePreviewEl.src = imageUrl;
    imagePreviewEl.alt = altText;
  }

  if (imagePreviewModalEl && window.bootstrap) {
    const modal = bootstrap.Modal.getInstance(imagePreviewModalEl) || new bootstrap.Modal(imagePreviewModalEl);
    modal.show();
  } else {
    window.open(imageUrl, '_blank', 'noopener');
  }
}

function updateImageFileName() {
  if (!postImageFilename) return;

  if (postImageInput?.files?.length) {
    postImageFilename.textContent = postImageInput.files[0].name;
  } else if (editingPostImageUrl) {
    postImageFilename.textContent = 'Current image will be kept';
  } else {
    postImageFilename.textContent = 'No file selected';
  }
}

async function submitPostForm() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to manage posts.');
    window.location.href = '/login';
    return;
  }

  const amountInput = document.getElementById('postAmount');
  const categorySelect = document.getElementById('postCategory');
  const descriptionInput = document.getElementById('postDescription');

  const formData = new FormData();
  formData.append('amount', amountInput?.value?.trim() || '');
  formData.append('category', categorySelect?.value || '');
  formData.append('description', descriptionInput?.value?.trim() || '');

  if (postImageInput?.files?.length) {
    formData.append('image', postImageInput.files[0]);
  }

  const endpoint = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';
  const method = editingPostId ? 'PUT' : 'POST';

  try {
    const response = await fetch(endpoint, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to save post.');
    }

    await loadPosts();

    if (postModalEl && window.bootstrap) {
      const modal = bootstrap.Modal.getInstance(postModalEl) || new bootstrap.Modal(postModalEl);
      modal.hide();
    }

    resetPostForm();
  } catch (error) {
    console.error('Post save error:', error);
    alert(error.message || 'Something went wrong while saving the post.');
  }
}

function resetPostForm() {
  if (addPostForm) {
    addPostForm.reset();
  }
  editingPostId = null;
  editingPostImageUrl = null;
  if (postModalTitle) {
    postModalTitle.textContent = 'Create a New Post';
  }
  if (postImageInput) {
    postImageInput.value = '';
  }
  updateImageFileName();
}

function populatePostForm(post) {
  if (!post || !addPostForm) return;

  const amountInput = document.getElementById('postAmount');
  const categorySelect = document.getElementById('postCategory');
  const descriptionInput = document.getElementById('postDescription');

  if (amountInput) {
    amountInput.value = typeof post.amount !== 'undefined' && post.amount !== null ? post.amount : '';
  }
  if (categorySelect) {
    categorySelect.value = post.category || '';
  }
  if (descriptionInput) {
    descriptionInput.value = post.description || '';
  }

  editingPostId = post.id;
  editingPostImageUrl = post.image_url || null;
  if (postModalTitle) {
    postModalTitle.textContent = 'Edit Post';
  }
  updateImageFileName();

  if (postModalEl && window.bootstrap) {
    const modal = bootstrap.Modal.getInstance(postModalEl) || new bootstrap.Modal(postModalEl);
    modal.show();
  }
}

function parsePostPayload(encodedPayload) {
  if (!encodedPayload) return null;
  try {
    return JSON.parse(decodeURIComponent(encodedPayload));
  } catch (error) {
    console.error('Unable to parse post payload:', error);
    return null;
  }
}

async function handleDeletePost(postId) {
  if (!postId) return;

  const confirmed = window.confirm('Are you sure you want to delete this post?');
  if (!confirmed) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to manage posts.');
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to delete post.');
    }

    await loadPosts();
  } catch (error) {
    console.error('Post deletion error:', error);
    alert(error.message || 'Unable to delete the post right now.');
  }
}

async function fetchCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    currentUserId = data.id;
    return data;
  } catch (error) {
    console.error('Unable to fetch current user:', error);
    return null;
  }
}

/* ----------------------------- REAL-TIME FEED ------------------------------ */

function startPostStream() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const sse = new EventSource('/api/posts/stream');

  sse.onmessage = (event) => {
    const post = JSON.parse(event.data);
    prependPost(post);
  };
}

function prependPost(post) {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  container.insertAdjacentHTML('afterbegin', buildPostHTML(post));
}

/* ----------------------- LOGOUT + PROFILE DROPDOWN UI ----------------------- */

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
}

/* ------------------------------- PAGE INIT -------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  renderLeaders();
  updateProgressBar();
  updateImageFileName();
  initializeFeed();
});

async function initializeFeed() {
  await fetchCurrentUser();
  await loadPosts();
  startPostStream();
}
