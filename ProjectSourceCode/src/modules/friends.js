const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const protect = require("../middleware/protect");

// helper
function getCurrentUserId(req) {
  if (!req.user) throw new Error("User not authenticated");
  return req.user.id;
}

/* ----------------------------- FRIENDS FEATURE ----------------------------- */

// SEND FRIEND REQUEST
router.post("/request", protect, async (req, res) => {
  const senderId = getCurrentUserId(req);
  const { recipientId } = req.body;

  if (senderId == recipientId) {
    return res.status(400).json({ error: "You can't friend yourself!" });
  }

  const duplicateRequest = await pool.query(
    `SELECT * FROM friends
     WHERE (user_id=$2 AND friend_id=$1)`,
    [senderId, recipientId]
  );

  if (duplicateRequest.rowCount > 0) {
    return res.status(400).json({ error: "Friend request already exists or is pending." });
  }

  try {
    await pool.query(
      `INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)`,
      [senderId, recipientId]
    );
    res.json({ message: "Friend request sent!" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Friend request already exists." });
    }
    res.status(500).json({ error: "Error sending friend request." });
  }
});

// ACCEPT FRIEND REQUEST
router.post("/accept", protect, async (req, res) => {
  const recipientId = getCurrentUserId(req);
  const { senderId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE friends
       SET status = 'accepted'
       WHERE ((user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1))
       AND status='pending'`,
      [recipientId, senderId]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ error: "Request not found." });

    res.json({ message: "Friend request accepted!" });
  } catch (err) {
    res.status(500).json({ error: "Error accepting friend request." });
  }
});

// REJECT FRIEND REQUEST
router.post("/reject", protect, async (req, res) => {
  const recipientId = getCurrentUserId(req);
  const { senderId } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM friends
       WHERE ((user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1))
       AND status='pending'`,
      [recipientId, senderId]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ error: "Request not found." });

    res.json({ message: "Friend request declined." });
  } catch (err) {
    res.status(500).json({ error: "Error declining friend request." });
  }
});

// GET FRIENDS LIST
router.get("/", protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  try {
    const result = await pool.query(
      `SELECT u.id, u.username
       FROM friends f
       JOIN users u ON (u.id=f.user_id OR u.id=f.friend_id)
       WHERE f.status='accepted'
       AND u.id <> $1
       AND ($1=f.user_id OR $1=f.friend_id)`,
      [currentUserId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching friends list." });
  }
});

// GET PENDING REQUESTS
router.get("/pending", protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  try {
    const result = await pool.query(
      `SELECT f.id, u.id as sender_id, u.username
       FROM friends f
       JOIN users u ON u.id=f.user_id
       WHERE f.status='pending'
       AND f.friend_id=$1`,
      [currentUserId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching pending friend requests." });
  }
});

// REMOVE FRIEND
router.post("/remove", protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);
  const { friendId } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM friends
       WHERE ((user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1))
       AND status='accepted'`,
      [currentUserId, friendId]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ error: "Friend not found." });

    res.json({ message: "Friend removed successfully." });
  } catch (err) {
    res.status(500).json({ error: "Error removing friend." });
  }
});

// SEARCH BY USERNAME
router.get("/search", protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);
  const query = req.query.query;

  if (!query)
    return res.status(400).json({ error: "Query is required" });

  try {
    const result = await pool.query(
      `SELECT id, username
       FROM users
       WHERE username ILIKE $1
       AND id <> $2
       LIMIT 10`,
      [`%${query}%`, currentUserId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error searching users." });
  }
});

module.exports = router;
