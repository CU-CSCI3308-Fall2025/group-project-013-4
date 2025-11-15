const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const protect = require("../middleware/protect");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload setup (unchanged)
const uploadsDir = path.join(__dirname, "..", "resources/uploads");
const postUploadsDir = path.join(uploadsDir, "posts");

if (!fs.existsSync(postUploadsDir)) {
  fs.mkdirSync(postUploadsDir, { recursive: true });
}

const postStorage = multer.diskStorage({
  destination: postUploadsDir,
  filename: (req, file, cb) => {
    cb(null, `post_${req.user.id}_${Date.now()}${path.extname(file.originalname) || ".png"}`);
  }
});
const postUpload = multer({ storage: postStorage });

// helper
function removeFileIfExists(filePath) {
  if (!filePath) return;
  const real = path.join(__dirname, "..", filePath.replace(/^\//, ""));
  if (fs.existsSync(real)) fs.unlinkSync(real);
}

const sanitizeAmount = value => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeText = value => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

/* ----------------------------- POSTS FEATURE ----------------------------- */

// GET FEED POSTS
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username, u.profile_picture
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// ADD POST
router.post("/", protect, postUpload.single("image"), async (req, res) => {
  const userId = req.user.id;

  const amount = sanitizeAmount(req.body.amount);
  const category = sanitizeText(req.body.category);
  const description = sanitizeText(req.body.description);
  const imageUrl = req.file ? `/resources/uploads/posts/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, amount, category, description, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, amount, category, description, imageUrl]
    );

    const newPost = result.rows[0];

    if (global.broadcastNewPost) {
      global.broadcastNewPost(newPost);
    }

    res.json(newPost);
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(500).json({ error: "Error creating post" });
  }
});

// UPDATE POST
router.put("/:id", protect, postUpload.single("image"), async (req, res) => {
  const userId = req.user.id;
  const postId = Number(req.params.id);

  try {
    const existing = await pool.query(`SELECT * FROM posts WHERE id = $1`, [postId]);

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = existing.rows[0];

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "You can only edit your own posts." });
    }

    const body = req.body || {};
    const updatedAmount = Object.prototype.hasOwnProperty.call(body, "amount")
      ? sanitizeAmount(body.amount)
      : post.amount;

    const updatedCategory = Object.prototype.hasOwnProperty.call(body, "category")
      ? sanitizeText(body.category)
      : post.category;

    const updatedDescription = Object.prototype.hasOwnProperty.call(body, "description")
      ? sanitizeText(body.description)
      : post.description;

    let updatedImageUrl = post.image_url;
    if (req.file) {
      removeFileIfExists(post.image_url);
      updatedImageUrl = `/resources/uploads/posts/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE posts
       SET amount=$1, category=$2, description=$3, image_url=$4
       WHERE id=$5
       RETURNING *`,
      [updatedAmount, updatedCategory, updatedDescription, updatedImageUrl, postId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating post:", err.message);
    res.status(500).json({ error: "Error updating post" });
  }
});

// DELETE POST
router.delete("/:id", protect, async (req, res) => {
  const userId = req.user.id;
  const postId = Number(req.params.id);

  try {
    const existing = await pool.query(`SELECT * FROM posts WHERE id = $1`, [postId]);

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = existing.rows[0];

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts." });
    }

    await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);
    removeFileIfExists(post.image_url);

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Error deleting post:", err.message);
    res.status(500).json({ error: "Error deleting post" });
  }
});

/* ------------------------ REAL-TIME POST STREAM (SSE) ------------------------ */

const sseClients = [];

router.get("/stream", protect, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  sseClients.push(res);

  req.on("close", () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

global.broadcastNewPost = function (post) {
  sseClients.forEach((client) => {
    client.write(`data: ${JSON.stringify(post)}\n\n`);
  });
};

module.exports = router;
