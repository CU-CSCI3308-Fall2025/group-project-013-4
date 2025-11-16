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

const sanitizeCoordinate = value => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/* ----------------------------- POSTS FEATURE ----------------------------- */

// GET FEED POSTS
router.get("/", protect, async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const result = await pool.query(
      `
      WITH friend_ids AS (
        SELECT friend_id AS id
        FROM friends
        WHERE user_id = $1 AND status='accepted'
        
        UNION
    
        SELECT user_id AS id
        FROM friends
        WHERE friend_id = $1 AND status='accepted'
      )
      
      SELECT p.*, u.username, u.profile_picture
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE 
        p.user_id = $1
        OR p.user_id IN (SELECT id FROM friend_ids)
      ORDER BY p.created_at DESC;
      `,
      [currentUserId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching posts:", err);
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
  const locationName = sanitizeText(req.body.location_name);
  const locationAddress = sanitizeText(req.body.location_address);
  const locationPlaceId = sanitizeText(req.body.location_place_id);
  const locationLat = sanitizeCoordinate(req.body.location_lat);
  const locationLng = sanitizeCoordinate(req.body.location_lng);

  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, amount, category, description, image_url,
                          location_name, location_address, location_lat, location_lng, location_place_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        amount,
        category,
        description,
        imageUrl,
        locationName,
        locationAddress,
        locationLat,
        locationLng,
        locationPlaceId
      ]
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

    const updatedLocationName = Object.prototype.hasOwnProperty.call(body, "location_name")
      ? sanitizeText(body.location_name)
      : post.location_name;

    const updatedLocationAddress = Object.prototype.hasOwnProperty.call(body, "location_address")
      ? sanitizeText(body.location_address)
      : post.location_address;

    const updatedLocationLat = Object.prototype.hasOwnProperty.call(body, "location_lat")
      ? sanitizeCoordinate(body.location_lat)
      : post.location_lat;

    const updatedLocationLng = Object.prototype.hasOwnProperty.call(body, "location_lng")
      ? sanitizeCoordinate(body.location_lng)
      : post.location_lng;

    const updatedLocationPlaceId = Object.prototype.hasOwnProperty.call(body, "location_place_id")
      ? sanitizeText(body.location_place_id)
      : post.location_place_id;

    let updatedImageUrl = post.image_url;
    if (req.file) {
      removeFileIfExists(post.image_url);
      updatedImageUrl = `/resources/uploads/posts/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE posts
       SET amount=$1, category=$2, description=$3, image_url=$4,
           location_name=$5, location_address=$6, location_lat=$7,
           location_lng=$8, location_place_id=$9
       WHERE id=$10
       RETURNING *`,
      [
        updatedAmount,
        updatedCategory,
        updatedDescription,
        updatedImageUrl,
        updatedLocationName,
        updatedLocationAddress,
        updatedLocationLat,
        updatedLocationLng,
        updatedLocationPlaceId,
        postId
      ]
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
