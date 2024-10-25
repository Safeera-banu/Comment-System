const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',  
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'comments_system' 
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.post('/api/login', (req, res) => {
  const { username } = req.body;

  if (username) {
    const sessionId = `session_${new Date().getTime()}`; 
    res.json({ sessionId, username }); 
  } else {
    res.status(400).send('Username is required');
  }
});


app.get('/comments', (req, res) => {
  db.query('SELECT * FROM comments', (err, results) => {
    if (err) {
      console.error('Error fetching comments:', err);
      res.status(500).send('Error fetching comments');
    } else {
      res.json(results);
    }
  });
});

app.post('/comments', (req, res) => {
  const { username, content, timestamp } = req.body;
  const query = 'INSERT INTO comments (username, content, timestamp) VALUES (?, ?, ?)';
  db.query(query, [username, content, timestamp], (err, result) => {
    if (err) {
      console.error('Error posting comment:', err);
      res.status(500).send('Error posting comment');
    } else {
      const newComment = { id: result.insertId, username, content, timestamp };
      io.emit('newComment', newComment); 
      res.status(200).send('Comment posted');
    }
  });
});

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
