const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const pool = require('../config/db');

// HOME PAGE
router.get('/', async (req, res) => {
  res.render('pages/home', {
    title: 'Home',
    isHome: true,
    year: new Date().getFullYear()
  });
});

// LEADERBOARD PAGE
router.get('/leaderboard', async (req, res) => {
  res.render('pages/leaderboard', {
    title: 'Leaderboard',
    isLeaderboard: true,
    year: new Date().getFullYear()
  });
});

// LOGIN PAGE
router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Login',
    bodyClass: 'auth-page'
  });
});

// REGISTER PAGE
router.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Register',
    bodyClass: 'auth-page'
  });
});

// LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// SETTINGS PAGE
router.get('/settings', async (req, res) => {
  res.render('pages/settings', {
    title: 'Settings',
    isSettings: true,
    year: new Date().getFullYear()
  });
});

// FRIENDS PAGE
router.get('/friends', protect, (req, res) => {
  res.render('pages/friends', {
    isFriends: true,
    title: 'Friends',
    year: new Date().getFullYear()
  });
});

// ADD TRANSACTION PAGE
router.get('/addtransaction', protect, (req, res) => {
  res.render('pages/transaction', {
    isAddTransaction: true,
    title: 'Add Transaction',
    year: new Date().getFullYear()
  });
});

// BUDGET PAGE
router.get('/budget', protect, (req, res) => {
  res.render('pages/budget', {
    isBudget: true,
    title: 'Budget',
    year: new Date().getFullYear()
  });
});

// PROFILE PAGE
router.get('/profile/:id', protect, async (req, res) => {
  const userId = req.params.id;

  try {
    // Get user info
    const userResult = await pool.query(
      `SELECT id, username, email, profile_picture
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).render('pages/404', { message: 'User not found' });
    }

    const user_pfp = userResult.rows[0];

    // Get user's posts
    const postsResult = await pool.query(
      `SELECT * FROM posts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const posts = postsResult.rows;

    res.render('pages/profile', {
      title: `${user_pfp.username}'s Profile`,
      user_pfp,
      posts,
      year: new Date().getFullYear()
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/500', { message: 'Server error' });
  }
});

//For testing purposes
router.get("/welcome", (req, res) => {
  res.json({ status: "success", message: "Welcome!" });
});


module.exports = router;
