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

const generateToken = id => jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwt', { expiresIn: '2h' });

const protect = (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.session.token) {
    token = req.session.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwt');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Home',
    isHome: true,
    year: new Date().getFullYear()
  });
});

app.get('/leaderboard', (req, res) => {
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

app.get('/friends', protect, (req, res) => {
  res.render('pages/friends', { 
    user: req.user,
    isFriends: true,
    title: 'Friends',
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
    console.error('❌ Login error:', error.message);
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

//friend request functionality starts here:

function getCurrentUserId(req) {
  if (!req.user) throw new Error('User not authenticated');
  return req.user.id;
}


//send request
app.post('/api/friends/request', protect, async (req, res) => {
  const senderId = getCurrentUserId(req);
  const { recipientId } = req.body;

  if(senderId == recipientId){
    return res.status(400).json({error: "You can't friend yourself!"});
  }

  //check to see if the sender has already been sent a request by the recipient
  const duplicateRequest = await pool.query(
    `SELECT * FROM friends
    WHERE (user_id=$2 AND friend_id=$1)`,
    [senderId, recipientId]
  );

  if(duplicateRequest.rowCount > 0){
    return res.status(400).json({ error: 'Friend request already exists or is pending.'});
  }

  try {
    await pool.query(
      `INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)`,
      [senderId, recipientId]
    );
    res.json({ message: 'Friend request sent!'});
  } catch (err) {
      if (err.code === '23505') { //need to update db to have unique property on friends so this functions correctly
        console.error(err);
        return res.status(400).json({ error: "Friend request already exists."});
      }
      console.error(err);
      return res.status(500).json({ error: "Error sending friend request."});
  }
});

//accept request
app.post('/api/friends/accept', protect, async (req, res) => {
  const recipientId = getCurrentUserId(req);
  const { senderId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE friends SET status='accepted'
      WHERE user_id=$1 AND friend_id=$2 AND status='pending'`,
      [recipientId, senderId]
    );
    if(result.rowCount === 0) {
      return res.status(400).json({ error: 'Request not found.'});
    }
    res.json({ message: 'Friend request accepted!'});
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error accepting friend request.'});
  }
});

//reject request
app.post('/api/friends/reject', protect, async (req, res) => {
  const recipientId = getCurrentUserId(req);
  const { senderId } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM friends
      WHERE user_id=$1 AND friend_id=$2 AND status='pending'`,
      [recipientId, senderId]
    );

    if(result.rowCount === 0){
       return res.status(400).json({ error: 'Request not found.'});
    }

    res.json({message: 'Friend request declined.'});
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error declining friend request.'});
  }
});

//get friends
app.get('/api/friends', protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  try{
    const result = await pool.query(
      `SELECT u.id, u.username
       FROM friends f
       JOIN users u ON (u.id = f.user_id OR u.id = f.friend_id)
       WHERE f.status = 'accepted'
         AND u.id <> $1
         AND ($1 = f.user_id OR $1 = f.friend_id)`,
      [currentUserId]
    );
    res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching friends list.'});
  }
});

//get pending requests

app.get('/api/friends/pending', protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  try{
    const result = await pool.query(
      `SELECT f.id, u.id as sender_id, u.username
       FROM friends f
       JOIN users u ON u.id = f.user_id
       WHERE f.status = 'pending'
         AND f.friend_id = $1`,
      [currentUserId]
    );
    res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching pending friend requests.'});
  }
});

// remove a friend
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

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Friend not found.' });
    }

    res.json({ message: 'Friend removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error removing friend.' });
  }
});

//search for friends by username
app.get('/api/friends/search', protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Adjust table/column names to match your database
    const result = await pool.query(
      `SELECT id, username 
       FROM users
       WHERE username ILIKE $1
       AND id <> $2
       LIMIT 10`,
      [`%${query}%`, currentUserId]
    ); //make it so that you cant look up friends you already have

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error searching users.' });
  }
});


//end of friend request funcitonality

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});


