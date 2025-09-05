// Author u22857941 : Christopher Yoko

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Stubbed authentication endpoints
app.post('/api/login', (req, res) => {
  // Dummy response for login
  res.json({
    success: true,
    message: 'Login successful (stubbed)',
    user: {
      id: 1,
      username: req.body.username,
      token: 'dummy-jwt-token'
    }
  });
});

app.post('/api/signup', (req, res) => {
  // Dummy response for signup
  res.json({
    success: true,
    message: 'Signup successful (stubbed)',
    user: {
      id: Date.now(),
      username: req.body.username,
      token: 'dummy-jwt-token'
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});