// posts.js — load posts, render posts, build HTML

window.currentUserId = null;

// Fetch current user
window.fetchCurrentUser = async function () {
  const token = window.API.getToken();
  if (!token) return null;

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return null;

    const data = await res.json();
    window.currentUserId = data.id;
    return data;
  } catch {
    return null;
  }
};

// Load posts from backend
window.loadPosts = async function () {
  const token = window.API.getToken();
  if (!token) return;

  try {
    const res = await fetch("/api/posts", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.error("Could not fetch posts");
      return;
    }

    const posts = await res.json();
    window.renderPostsFromDB(posts);
  } catch (err) {
    console.error("Post load error:", err);
  }
};

// Render array of posts
window.renderPostsFromDB = function (posts) {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  if (!posts?.length) {
    container.innerHTML = `<p class="text-muted">No posts yet.</p>`;
    return;
  }

  container.innerHTML = posts.map(window.buildPostHTML).join("");
};

// Build HTML for one post
window.buildPostHTML = function (post) {
  if (!post) return "";

  const avatar = post.profile_picture || "/resources/img/PFP_Default.jpeg";
  const username = post.username || "WalletWatch User";
  const createdAt = post.created_at ? new Date(post.created_at).toLocaleString() : "";
  const amount = post.amount ? Number(post.amount).toFixed(2) : null;
  const category = post.category || "";
  const desc = post.description || "";
  const img = post.image_url
    ? `<img src="${post.image_url}" class="post-image" data-full-image="${post.image_url}" />`
    : "";

  const canEdit = Number(post.user_id) === Number(window.currentUserId);

  const payload = encodeURIComponent(
    JSON.stringify({
      id: post.id,
      amount: post.amount,
      category: post.category,
      description: post.description,
      image_url: post.image_url,
      location_name: post.location_name,
      location_address: post.location_address,
      location_lat: post.location_lat,
      location_lng: post.location_lng,
      location_place_id: post.location_place_id
    })
  );

  const locationDisplay = post.location_name || post.location_address;
  const locationAddress = post.location_address && post.location_address !== (post.location_name || "")
    ? post.location_address
    : "";

  const mapsQuery = locationDisplay
    ? encodeURIComponent(post.location_address || post.location_name)
    : "";

  const mapsLink = locationDisplay
    ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}${post.location_place_id ? `&query_place_id=${encodeURIComponent(post.location_place_id)}` : ""}`
    : null;

  return `
    <div class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <div class="post-user">
          <img src="${avatar}" class="post-avatar-img"/>
          <div class="post-user-info">
            <h3>${username}</h3>
            <p>${createdAt}</p>
          </div>
        </div>

        ${amount || category ? `
          <div class="post-amount">
            ${amount ? `<div class="post-price">$${amount}</div>` : ""}
            ${category ? `<span class="post-category">${category}</span>` : ""}
          </div>` 
        : ""}
      </div>

      ${desc ? `<p class="post-description">${desc}</p>` : ""}
      ${img}
      ${locationDisplay ? `
        <div class="post-location">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21c-4.418 0-8-4.03-8-9s3.582-9 8-9 8 4.03 8 9-3.582 9-8 9z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <div class="post-location-details">
            <div class="post-location-title">${locationDisplay}</div>
            ${locationAddress ? `<div class="post-location-address">${locationAddress}</div>` : ""}
            ${mapsLink ? `<a class="post-location-link" href="${mapsLink}" target="_blank" rel="noopener">Open in Google Maps</a>` : ""}
          </div>
        </div>
      ` : ""}

      ${canEdit ? `
        <div class="post-actions">
          <button class="post-action post-edit-btn" data-post="${payload}">✏️ Edit</button>
          <button class="post-action delete post-delete-btn" data-post-id="${post.id}">🗑 Delete</button>
        </div>` 
      : ""}
    </div>
  `;
};
