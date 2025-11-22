const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const protect = require('../middleware/protect');
const { requireEnv } = require('../utils/env');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

/* -------------------------------------------------------------------------- */
/*                            FILE UPLOAD SETUP                               */
/* -------------------------------------------------------------------------- */

const ensureDirExists = dirPath => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const uploadsDir = path.join(__dirname, '..', 'resources/uploads');
const postUploadsDir = path.join(uploadsDir, 'posts');
ensureDirExists(uploadsDir);
ensureDirExists(postUploadsDir);

const profileStorage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `user_${req.user.id}_${Date.now()}.png`)
});
const profileUpload = multer({ storage: profileStorage });

/* -------------------------------------------------------------------------- */
/*                            TOKEN / HELPERS                                 */
/* -------------------------------------------------------------------------- */

const jwtSecret = requireEnv('JWT_SECRET');
const generateToken = id => jwt.sign({ id }, jwtSecret, { expiresIn: '2h' });

const removeFileIfExists = filePath => {
  if (!filePath) return;
  const normalizedPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
  if (fs.existsSync(normalizedPath)) fs.unlinkSync(normalizedPath);
};

/* -------------------------------------------------------------------------- */
/*                                AUTH ROUTES                                 */
/* -------------------------------------------------------------------------- */

// REGISTER
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: 'Please fill all fields' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashed]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    // ✅ No req.session — stateless JWT
    res.status(201).json({ ...user, token });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user.id);

    // ✅ Stateless JWT
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// AUTH ME
router.get('/me', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ACCOUNT
router.delete('/delete', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    // Remove profile pic file if it exists
    const picResult = await pool.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [userId]
    );
    const profilePath = picResult.rows[0]?.profile_picture;
    if (profilePath && !profilePath.includes('PFP_Default.jpeg')) {
      const fullPath = path.join(__dirname, '..', profilePath.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: 'User not found' });

    // ✅ No session to destroy on Render
    res.json({ message: 'Account successfully deleted' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPLOAD PROFILE PICTURE
router.post('/upload-profile', protect, profileUpload.single('profile'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );
    const oldPath = result.rows[0]?.profile_picture;

    if (oldPath && !oldPath.includes('PFP_Default.jpeg')) {
      const fullPath = path.join(__dirname, '..', oldPath.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    const newFilePath = `/resources/uploads/${req.file.filename}`;
    await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2',
      [newFilePath, req.user.id]
    );

    res.json({ message: 'Uploaded', url: newFilePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Profile upload failed' });
  }
});

module.exports = router;
