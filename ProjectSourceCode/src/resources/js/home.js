// home.js — only runs on the home page

document.addEventListener("DOMContentLoaded", async () => {
  window.renderLeaders();
  window.updateProgressBar();
  window.updateImageFileName();

  await window.fetchCurrentUser();
  await window.loadPosts();
  window.startPostStream();

  // Modal events
  const addForm = document.getElementById("addPostForm");
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await window.submitPostForm();
    });
  }

  const postsContainer = document.getElementById("postsContainer");
  if (postsContainer) {
    postsContainer.addEventListener("click", (e) => {
      const img = e.target.closest(".post-image");
      if (img) {
        const previewModal = new bootstrap.Modal(
          document.getElementById("imagePreviewModal")
        );
        document.getElementById("imagePreview").src = img.dataset.fullImage || img.src;
        previewModal.show();
      }

      const editBtn = e.target.closest(".post-edit-btn");
      if (editBtn) {
        const postData = window.parsePostPayload(editBtn.dataset.post);
        window.populatePostForm(postData);
      }

      const delBtn = e.target.closest(".post-delete-btn");
      if (delBtn) {
        window.handleDeletePost(delBtn.dataset.postId);
      }
    });
  }
});
