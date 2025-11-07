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

app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

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

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});

module.exports = server;
