const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const protect = require("../middleware/protect");

// Helper to get logged-in user ID
function getCurrentUserId(req) {
  return req.user.id;
}

/* ---------------- GLOBAL LEADERBOARD ---------------- */
router.get("/global", protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.profile_picture,
             COALESCE(SUM(t.amount), 0) AS total_spending
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id
      ORDER BY total_spending DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load global leaderboard" });
  }
});

/* ---------------- FRIENDS-ONLY LEADERBOARD ---------------- */
router.get("/friends", protect, async (req, res) => {
  const userId = getCurrentUserId(req);

  try {
    const result = await pool.query(`
      WITH friend_list AS (
        SELECT 
          CASE 
            WHEN f.user_id = $1 THEN f.friend_id
            ELSE f.user_id
          END AS friend_id
        FROM friends f
        WHERE (f.user_id = $1 OR f.friend_id = $1)
        AND f.status = 'accepted'
      )
      SELECT u.id, u.username, u.profile_picture,
             COALESCE(SUM(t.amount), 0) AS total_spending
      FROM users u
      JOIN friend_list fl ON fl.friend_id = u.id
      LEFT JOIN transactions t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY total_spending DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load friends leaderboard" });
  }
});

module.exports = router;