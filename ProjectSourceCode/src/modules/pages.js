const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/* -------------------------------------------------------------------------- */
/*                             PAGE ROUTES (UI)                               */
/* -------------------------------------------------------------------------- */

// 🔒 Helper: redirect unauthenticated users to /login
function ensureLoggedIn(req, res) {
  // Render cannot read localStorage; only check for session tokens if using stateful hosting
  if (!req.headers.authorization && !req.session?.token) {
    res.redirect('/login');
    return false;
  }
  return true;
}

/* ------------------------------- HOME PAGE ------------------------------- */
router.get('/', async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;

  res.render('pages/home', {
    title: 'Home',
    isHome: true,
    year: new Date().getFullYear()
  });
});

/* ----------------------------- LEADERBOARD ------------------------------- */
router.get('/leaderboard', async (req, res) => {
  if (!ensureLoggedIn(req, res)) return; 

  res.render('pages/leaderboard', {
    title: 'Leaderboard',
    isLeaderboard: true,
    year: new Date().getFullYear()
  });
});

/* --------------------------------- LOGIN --------------------------------- */
router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Login',
    bodyClass: 'auth-page'
  });
});

/* ------------------------------- REGISTER -------------------------------- */
router.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Register',
    bodyClass: 'auth-page'
  });
});

/* -------------------------------- LOGOUT --------------------------------- */
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

/* ------------------------------- SETTINGS -------------------------------- */
router.get('/settings', async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;

  res.render('pages/settings', {
    title: 'Settings',
    isSettings: true,
    year: new Date().getFullYear()
  });
});

/* -------------------------------- FRIENDS -------------------------------- */
router.get('/friends', async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;

  res.render('pages/friends', {
    isFriends: true,
    title: 'Friends',
    year: new Date().getFullYear()
  });
});

/* --------------------------- ADD TRANSACTION ----------------------------- */
router.get('/addtransaction', async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;

  res.render('pages/transaction', {
    isAddTransaction: true,
    title: 'Add Transaction',
    year: new Date().getFullYear()
  });
});

/* --------------------------------- BUDGET -------------------------------- */
router.get('/budget', async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;

  res.render('pages/budget', {
    isBudget: true,
    title: 'Budget',
    year: new Date().getFullYear()
  });
});

/* -------------------------------- PROFILE -------------------------------- */
router.get('/profile/:id', async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;

  const userId = req.params.id;

  try {
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
    const postsResult = await pool.query(
      `SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.render('pages/profile', {
      title: `${user_pfp.username}'s Profile`,
      user_pfp,
      posts: postsResult.rows,
      year: new Date().getFullYear()
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/500', { message: 'Server error' });
  }
});

/* -------------------------------- WELCOME -------------------------------- */
router.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

module.exports = router;
