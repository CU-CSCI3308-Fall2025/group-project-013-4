const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const protect = require("../middleware/protect");

/* ----------------------------- BUDGETS FEATURE ----------------------------- */


router.post("/", protect, async (req, res) => {
  const { category, amount, period } = req.body;
  const userId = req.user.id;

  if (!category || !amount)
    return res.status(400).json({ message: "Category and amount are required." });

  try {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category, limit_amount, period)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category, period)
       DO UPDATE SET limit_amount = $3, period = $4
       RETURNING *`,
      [userId, category, amount, period || 'monthly']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});



router.get("/summary", protect, async (req, res) => {
  try {
    // gets all budgets for user 
    // calculates spending from transactios for the current month grouped by category
    
    const query = `
      WITH current_month_spending AS (
        SELECT
          category,
          SUM(amount) AS total_spent
        FROM transactions
        WHERE user_id = $1
          AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        GROUP BY category
      )
      SELECT
        b.category,
        b.limit_amount AS budget_amount,
        COALESCE(cms.total_spent, 0) AS total_spent,
        (b.limit_amount - COALESCE(cms.total_spent, 0)) AS remaining_amount
      FROM budgets b
      LEFT JOIN current_month_spending cms ON b.category = cms.category
      WHERE b.user_id = $1
      ORDER BY b.category;
    `;
    
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;