// posts.modal.js — add/edit modal logic

window.editingPostId = null;
window.editingPostImageUrl = null;

window.updateImageFileName = function () {
  const input = document.getElementById("postImage");
  const label = document.getElementById("postImageFilename");
  if (!label) return;

  if (input?.files?.length) {
    label.textContent = input.files[0].name;
  } else if (window.editingPostImageUrl) {
    label.textContent = "Current image will be kept";
  } else {
    label.textContent = "No file selected";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("postImage");
  const uploadTrigger = document.getElementById("triggerImageUpload");

  if (uploadTrigger && fileInput) {
    uploadTrigger.addEventListener("click", () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => window.updateImageFileName());
  }
});

// Parse encoded post JSON from edit button
window.parsePostPayload = function (encoded) {
  try {
    return JSON.parse(decodeURIComponent(encoded));
  } catch (err) {
    console.error("Payload decode error:", err);
    return null;
  }
};

// Populate modal for editing
window.populatePostForm = function (post) {
  if (!post) return;

  document.getElementById("postAmount").value = post.amount ?? "";
  document.getElementById("postCategory").value = post.category ?? "";
  document.getElementById("postDescription").value = post.description ?? "";

  if (window.PostLocation) {
    window.PostLocation.setFromPost(post);
  }

  window.editingPostId = post.id;
  window.editingPostImageUrl = post.image_url || null;

  window.updateImageFileName();

  const modalEl = document.getElementById("addPostModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
};

// Prefill a new post (e.g., from a shared transaction) and open the modal
window.prefillNewPost = function (draft = {}, options = {}) {
  window.resetPostForm();

  const amountInput = document.getElementById("postAmount");
  const categoryInput = document.getElementById("postCategory");
  const descriptionInput = document.getElementById("postDescription");

  if (amountInput && draft.amount !== undefined && draft.amount !== null && String(draft.amount).trim() !== "") {
    const parsedAmount = Number(draft.amount);
    if (Number.isFinite(parsedAmount)) {
      amountInput.value = parsedAmount.toFixed(2);
    }
  }

  if (categoryInput && draft.category) {
    categoryInput.value = draft.category;
  }

  if (descriptionInput && draft.description) {
    descriptionInput.value = draft.description;
  }

  if (options.title) {
    document.getElementById("postModalTitle").textContent = options.title;
  }

  const modalEl = document.getElementById("addPostModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
};

// Reset modal to blank state
window.resetPostForm = function () {
  const form = document.getElementById("addPostForm");
  if (form) form.reset();

  window.editingPostId = null;
  window.editingPostImageUrl = null;

  if (window.PostLocation) {
    window.PostLocation.reset();
  }

  document.getElementById("postImage").value = "";
  document.getElementById("postModalTitle").textContent = "Create a New Post";

  window.updateImageFileName();
};

// Submit modal form
window.submitPostForm = async function () {
  const token = window.API.getToken();
  if (!token) {
    alert("Please log in.");
    return (window.location.href = "/login");
  }

  const formData = new FormData();
  formData.append("amount", document.getElementById("postAmount").value.trim());
  formData.append("category", document.getElementById("postCategory").value);
  formData.append("description", document.getElementById("postDescription").value.trim());

  const fileInput = document.getElementById("postImage");
  if (fileInput?.files?.length) {
    formData.append("image", fileInput.files[0]);
  }

  if (window.PostLocation) {
    window.PostLocation.appendToFormData(formData);
  }

  const endpoint = window.editingPostId
    ? `/api/posts/${window.editingPostId}`
    : `/api/posts`;

  const method = window.editingPostId ? "PUT" : "POST";

  const res = await fetch(endpoint, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Unable to save post.");
    return;
  }

  // refresh feed
  window.loadPosts();

  // close modal
  bootstrap.Modal.getInstance(document.getElementById("addPostModal")).hide();

  window.resetPostForm();
};

// Delete post
window.handleDeletePost = async function (id) {
  if (!confirm("Delete this post?")) return;

  const token = window.API.getToken();
  const res = await fetch(`/api/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Unable to delete post.");
    return;
  }

  window.loadPosts();
};
