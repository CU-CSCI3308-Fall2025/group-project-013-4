const jwt = require('jsonwebtoken');
const { requireEnv } = require('../utils/env');

const jwtSecret = requireEnv('JWT_SECRET');

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
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = protect;
