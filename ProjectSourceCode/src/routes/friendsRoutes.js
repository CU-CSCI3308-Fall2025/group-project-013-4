const express = require('express');
const app = express.Router();

export function getCurrentUserId(req) {
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
}); //works

//accept request
app.post('/api/friends/accept', protect, async (req, res) => {
  const recipientId = getCurrentUserId(req);
  const { senderId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE friends
      SET status = 'accepted'
      WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
      AND status = 'pending';`,
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
}); //working

//reject request
app.post('/api/friends/reject', protect, async (req, res) => {
  const recipientId = getCurrentUserId(req);
  const { senderId } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM friends
      WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
      AND status = 'pending';`,
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
}); //working

//get friends
app.get('/api/friends', protect, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.removeHeader('ETag');
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
}); //verified working

//get pending requests
app.get('/api/friends/pending', protect, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.removeHeader('ETag');
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
}); //verified working

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
}); //need to implement in front end

//search for friends by username
app.get('/api/friends/search', protect, async (req, res) => {
  const currentUserId = getCurrentUserId(req);
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
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

module.exports = app;