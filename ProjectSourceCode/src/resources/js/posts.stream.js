// posts.stream.js — incoming real-time posts (SSE)

window.startPostStream = function () {
  const token = window.API.getToken();
  if (!token) return;

  const stream = new EventSource("/api/posts/stream");

  stream.onmessage = (event) => {
    try {
      const post = JSON.parse(event.data);
      window.prependPost(post);
    } catch (err) {
      console.error("Stream error:", err);
    }
  };
};

// Prepend new post to feed
window.prependPost = function (post) {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.insertAdjacentHTML("afterbegin", window.buildPostHTML(post));
};
