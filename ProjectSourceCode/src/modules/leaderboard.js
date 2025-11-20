const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const protect = require("../middleware/protect");

// Helper to get logged-in user ID
function getCurrentUserId(req) {
  return req.user.id;
}

/* ==========================================================================
   GLOBAL SAVINGS LEADERBOARD
   ========================================================================== */

router.get("/global", protect, async (req, res) => {
  try {
    const result = await pool.query(`
      WITH user_budgets AS (
        SELECT 
          user_id, 
          COALESCE(SUM(limit_amount), 0) AS total_budget
        FROM budgets
        WHERE period = 'monthly'
        GROUP BY user_id
      ),
      user_spending AS (
        SELECT 
          user_id, 
          COALESCE(SUM(amount), 0) AS total_spending
        FROM transactions
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        GROUP BY user_id
      )
      SELECT 
        u.id,
        u.username,
        u.profile_picture,
        COALESCE(b.total_budget, 0)   AS total_budget,
        COALESCE(s.total_spending, 0) AS total_spending,
        CASE
          WHEN COALESCE(b.total_budget, 0) > 0 THEN
            (b.total_budget - COALESCE(s.total_spending, 0)) / b.total_budget
          ELSE NULL
        END AS savings_percentage
      FROM users u
      LEFT JOIN user_budgets b ON u.id = b.user_id
      LEFT JOIN user_spending s ON u.id = s.user_id
      ORDER BY savings_percentage DESC NULLS LAST;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load global leaderboard" });
  }
});

/* ==========================================================================
   FRIENDS-ONLY SAVINGS LEADERBOARD
   ========================================================================== */

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
      ),
      user_budgets AS (
        SELECT 
          user_id, 
          COALESCE(SUM(limit_amount), 0) AS total_budget
        FROM budgets
        WHERE period = 'monthly'
        GROUP BY user_id
      ),
      user_spending AS (
        SELECT 
          user_id, 
          COALESCE(SUM(amount), 0) AS total_spending
        FROM transactions
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        GROUP BY user_id
      )
      SELECT 
        u.id,
        u.username,
        u.profile_picture,
        COALESCE(b.total_budget, 0)   AS total_budget,
        COALESCE(s.total_spending, 0) AS total_spending,
        CASE
          WHEN COALESCE(b.total_budget, 0) > 0 THEN
            (b.total_budget - COALESCE(s.total_spending, 0)) / b.total_budget
          ELSE NULL
        END AS savings_percentage
      FROM users u
      JOIN friend_list fl ON fl.friend_id = u.id
      LEFT JOIN user_budgets b ON u.id = b.user_id
      LEFT JOIN user_spending s ON u.id = s.user_id
      ORDER BY savings_percentage DESC NULLS LAST;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load friends leaderboard" });
  }
});

module.exports = router;