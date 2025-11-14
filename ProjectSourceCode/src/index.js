const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

dotenv.config();

const app = express();

const hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials')
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboardcat',
    saveUninitialized: false,
    resave: false
  })
);

app.use('/resources', express.static(path.join(__dirname, 'resources')));

const pool = new Pool({
  user: process.env.DB_USER || 'walletwatch_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'walletwatch',
  password: process.env.DB_PASS || 'walletwatch_pass',
  port: Number(process.env.DB_PORT) || 5432
});

pool
  .connect()
  .then(client => {
    console.log('✅ Database connection successful');
    client.release();
  })
  .catch(error => {
    console.error('❌ Database connection error:', error.message);
  });

async function ensurePostsTableSchema() {
  const queries = [
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT",
    "ALTER TABLE posts ALTER COLUMN amount DROP NOT NULL",
    "ALTER TABLE posts ALTER COLUMN category DROP NOT NULL",
    "ALTER TABLE posts ALTER COLUMN description DROP NOT NULL",
    "ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check",
    "ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_description_check"
  ];

  for (const statement of queries) {
    try {
      await pool.query(statement);
    } catch (error) {
      console.warn('⚠️ Unable to adjust posts table schema:', error.message);
    }
  }
}

ensurePostsTableSchema();

const generateToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwt', {
    expiresIn: '2h'
  });

const protect = (req, res, next) => {
  let token = null;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.session.token) {
    token = req.session.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'supersecretjwt'
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Storage for profile pictures
const multer = require('multer');
const fs = require('fs');

const ensureDirExists = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const uploadsDir = path.join(__dirname, 'resources/uploads');
const postUploadsDir = path.join(uploadsDir, 'posts');

ensureDirExists(uploadsDir);
ensureDirExists(postUploadsDir);

const profileStorage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `user_${req.user.id}_${Date.now()}.png`);
  }
});

const profileUpload = multer({ storage: profileStorage });

const postStorage = multer.diskStorage({
  destination: postUploadsDir,
  filename: (req, file, cb) => {
    cb(null, `post_${req.user.id}_${Date.now()}${path.extname(file.originalname) || '.png'}`);
  }
});

const postUpload = multer({ storage: postStorage });

const removeFileIfExists = filePath => {
  if (!filePath) return;
  const normalizedPath = path.join(__dirname, filePath.replace(/^\//, ''));
  if (fs.existsSync(normalizedPath)) {
    fs.unlinkSync(normalizedPath);
  }
};

app.post('/api/auth/upload-profile', protect, profileUpload.single('profile'), async (req, res) => {
  try {
    // Get current profile picture path from DB
    const result = await pool.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );

    const oldPath = result.rows[0]?.profile_picture;

    // Delete old file if it exists and is not the default
    if (oldPath && !oldPath.includes('PFP_Default.jpeg')) {
      // Convert URL path to filesystem path
      const fullPath = path.join(__dirname, oldPath.replace(/^\//, '')); // remove leading slash
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath); // synchronous deletion
        console.log('Old profile picture deleted:', fullPath);
      }
    }

    // Save new profile picture path
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


app.use(async (req, res, next) => {
  res.locals.user = null; // default for guests

  try {
    const token = req.session.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretjwt");

    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length > 0) {
      res.locals.user = result.rows[0];
    }

    next();
  } catch (err) {
    res.locals.user = null;
    next();
  }
});

app.get('/', async (req, res) => {
  res.render('pages/home', {
    title: 'Home',
    isHome: true,
    year: new Date().getFullYear()
  });
});

app.get('/leaderboard', async (req, res) => {
  res.render('pages/leaderboard', {
    title: 'Leaderboard',
    isLeaderboard: true,
    year: new Date().getFullYear()
  });
});

app.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Login',
    bodyClass: 'auth-page'
  });
});

app.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Register',
    bodyClass: 'auth-page'
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/settings', async (req, res) => {
  res.render('pages/settings', {
    title: 'Settings',
    isSettings: true,
    year: new Date().getFullYear()
  });
});

// Friends page
app.get('/friends', protect, (req, res) => {
  res.render('pages/friends', {
    user: req.user,
    isFriends: true,
    title: 'Friends',
    year: new Date().getFullYear()
  });
});

// Add Transaction page
app.get('/addtransaction', protect, (req, res) => {
  res.render('pages/transaction', {
    isAddTransaction: true,
    title: 'Add Transaction',
    year: new Date().getFullYear()
  });
});

//budget
app.get('/budget', protect, (req, res) => {
  res.render('pages/budget', {
    isBudget: true,
    title: 'Budget',
    year: new Date().getFullYear()
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashed]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);
    req.session.token = token;

    res.status(201).json({ ...user, token });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    req.session.token = token;

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    console.error(' Login error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ----------------------------- FRIENDS FEATURE ----------------------------- */

function getCurrentUserId(req) {
  if (!req.user) throw new Error('User not authenticated');
  return req.user.id;
}

// SEND FRIEND REQUEST
app.post('/api/friends/request', protect, async (req, res) => {
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
    return res.status(400).json({ error: 'Friend request already exists or is pending.' });
  }

  try {
    await pool.query(
      `INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)`,
      [senderId, recipientId]
    );
    res.json({ message: 'Friend request sent!' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "Friend request already exists." });
    }
    res.status(500).json({ error: "Error sending friend request." });
  }
});

// ACCEPT FRIEND REQUEST
app.post('/api/friends/accept', protect, async (req, res) => {
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
      return res.status(400).json({ error: 'Request not found.' });

    res.json({ message: 'Friend request accepted!' });
  } catch (err) {
    res.status(500).json({ error: 'Error accepting friend request.' });
  }
});

// REJECT FRIEND REQUEST
app.post('/api/friends/reject', protect, async (req, res) => {
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
      return res.status(400).json({ error: 'Request not found.' });

    res.json({ message: 'Friend request declined.' });
  } catch (err) {
    res.status(500).json({ error: 'Error declining friend request.' });
  }
});

// GET FRIENDS LIST
app.get('/api/friends', protect, async (req, res) => {
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
    res.status(500).json({ error: 'Error fetching friends list.' });
  }
});

// GET PENDING REQUESTS
app.get('/api/friends/pending', protect, async (req, res) => {
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
    res.status(500).json({ error: 'Error fetching pending friend requests.' });
  }
});

// REMOVE FRIEND
app.post('/api/friends/remove', protect, async (req, res) => {
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
      return res.status(400).json({ error: 'Friend not found.' });

    res.json({ message: 'Friend removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error removing friend.' });
  }
});

// SEARCH FRIENDS
app.get('/api/friends/search', protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);
  const query = req.query.query;

  if (!query)
    return res.status(400).json({ error: 'Query is required' });

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
    res.status(500).json({ error: 'Error searching users.' });
  }
});

/* ----------------------------- TRANSACTIONS FEATURE ----------------------------- */

app.post('/api/transactions', protect, async (req, res) => {
  const { amount, category, description, created_at } = req.body;

  if (!amount || !category)
    return res.status(400).json({ message: 'Amount and category are required.' });

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, category, description, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, amount, category, description || '', created_at || new Date()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', protect, async (req, res) => {
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

app.delete('/api/transactions/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Transaction not found' });

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/transactions/:id', protect, async (req, res) => {
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
      return res.status(404).json({ message: 'Transaction not found' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Budget


// Delete current user's account
app.delete('/api/auth/delete', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    // Delete the user
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Destroy session after deletion
    req.session.destroy(err => {
      if (err) console.error('Session destruction error:', err);
    });

    res.json({ message: 'Account successfully deleted' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



/* ----------------------------- POSTS FEATURE ----------------------------- */

const sanitizeAmount = value => {
  if (typeof value === 'undefined' || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeText = value => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

// GET ALL POSTS (feed)
app.get('/api/posts', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username, u.profile_picture
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// ADD POST
app.post('/api/posts', protect, postUpload.single('image'), async (req, res) => {
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
    console.error('Error creating post:', err.message);
    res.status(500).json({ error: 'Error creating post' });
  }
});

// UPDATE POST
app.put('/api/posts/:id', protect, postUpload.single('image'), async (req, res) => {
  const userId = req.user.id;
  const postId = Number(req.params.id);

  try {
    const existingResult = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);

    if (existingResult.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingPost = existingResult.rows[0];

    if (existingPost.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own posts.' });
    }

    const updatedAmount = Object.prototype.hasOwnProperty.call(req.body, 'amount')
      ? sanitizeAmount(req.body.amount)
      : existingPost.amount;
    const updatedCategory = Object.prototype.hasOwnProperty.call(req.body, 'category')
      ? sanitizeText(req.body.category)
      : existingPost.category;
    const updatedDescription = Object.prototype.hasOwnProperty.call(req.body, 'description')
      ? sanitizeText(req.body.description)
      : existingPost.description;

    let updatedImageUrl = existingPost.image_url;
    if (req.file) {
      removeFileIfExists(existingPost.image_url);
      updatedImageUrl = `/resources/uploads/posts/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE posts
       SET amount = $1,
           category = $2,
           description = $3,
           image_url = $4
       WHERE id = $5
       RETURNING *`,
      [updatedAmount, updatedCategory, updatedDescription, updatedImageUrl, postId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating post:', err.message);
    res.status(500).json({ error: 'Error updating post' });
  }
});

// DELETE POST
app.delete('/api/posts/:id', protect, async (req, res) => {
  const userId = req.user.id;
  const postId = Number(req.params.id);

  try {
    const existingResult = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);

    if (existingResult.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingPost = existingResult.rows[0];

    if (existingPost.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
    removeFileIfExists(existingPost.image_url);

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Error deleting post:', err.message);
    res.status(500).json({ error: 'Error deleting post' });
  }
});


/* ------------------------ REAL-TIME POST STREAM (SSE) ------------------------ */
const sseClients = [];

app.get('/api/posts/stream', protect, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  sseClients.push(res);

  req.on("close", () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

global.broadcastNewPost = function (post) {
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify(post)}\n\n`);
  });
};



app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

console.log('Registered routes:');
app._router.stack
  .filter(r => r.route)
  .map(r => console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});

module.exports = server;

// Get a specific user's profile page
app.get('/profile/:id', protect, async (req, res) => {
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

    const user = userResult.rows[0];

    // Get user's posts
    const postsResult = await pool.query(
      `SELECT * FROM posts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const posts = postsResult.rows;

    res.render('pages/profile', {
      title: `${user.username}'s Profile`,
      user,
      posts,
      year: new Date().getFullYear()
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/500', { message: 'Server error' });
  }
});
