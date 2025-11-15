const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const protect = require("../middleware/protect");

/* ----------------------------- TRANSACTIONS FEATURE ----------------------------- */

// CREATE TRANSACTION
router.post("/", protect, async (req, res) => {
  const { amount, category, description, created_at } = req.body;

  if (!amount || !category)
    return res.status(400).json({ message: "Amount and category are required." });

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, category, description, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, amount, category, description || "", created_at || new Date()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET USER TRANSACTIONS
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM transactions
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE TRANSACTION
router.delete("/:id", protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Transaction not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE TRANSACTION
router.put("/:id", protect, async (req, res) => {
  const { id } = req.params;
  const { amount, category, description, created_at } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET amount=$1, category=$2, description=$3, created_at=$4
       WHERE id=$5 AND user_id=$6
       RETURNING *`,
      [amount, category, description, created_at, id, userId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Transaction not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
