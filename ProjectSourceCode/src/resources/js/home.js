// home.js — only runs on the home page

document.addEventListener("DOMContentLoaded", async () => {
  // window.renderLeaders();
  // window.updateProgressBar();
  window.updateImageFileName();

  user = await window.fetchCurrentUser();
  await window.loadPosts();
  window.startPostStream();

  leaders = await fetchLeaders();
  renderLeaders(leaders);
  budgetSummary(user);

  async function fetchLeaders() {
    try {
      const token = window.API.getToken();
      const res = await fetch("/api/leaderboard/global", {
      headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return data.slice(0, 3);
    } catch (err) {
      console.error("Error fetching leaders:", err);
      return [];
    }
  }

  function renderLeaders(leaders) {
    const container = document.getElementById("leadersList");
    if (!container) return;

    container.innerHTML = leaders.map((leader, index) => `
      <div class="leader-item">
        <div class="leader-info">
          <div class="post-avatar">
              <img 
                src="${leader.profile_picture || '/resources/img/PFP_Default.jpeg'}" 
                alt="${leader.username}" 
                class="post-avatar-img" 
              />
          </div>
          <div class="leader-details">
            <h3>${leader.username}</h3>
            <p>${leader.savings_percentage != null
                ? "Saved " + (leader.savings_percentage * 100).toFixed(1) + "%" 
              : "No budget set"}</p>
          </div>
        </div>
        <span class="leader-medal">
          ${index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
        </span>
      </div>
    `).join("");
  }

  function budgetSummary(user) {
  // your logic to update the sidebar budget summary
  }

  // If the user shared a transaction, prefill a post and open the modal
  let draftFromTransaction = null;
  try {
    draftFromTransaction = sessionStorage.getItem("postDraftFromTransaction");
  } catch (err) {
    console.warn("Unable to read transaction draft from storage", err);
  }

  if (draftFromTransaction) {
    sessionStorage.removeItem("postDraftFromTransaction");

    try {
      const draft = JSON.parse(draftFromTransaction);
      window.prefillNewPost(draft, {
        title: "Share a Transaction",
        addToTransactionsDefault: false
      });
    } catch (err) {
      console.warn("Could not parse transaction draft", err);
    }
  }

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
