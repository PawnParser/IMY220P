// Author u22857941 : Christopher Yoko

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://u22857941:Sm9x38gRbDdL4hKt@imy220prac5.41pvu.mongodb.net/versioncontrol?retryWrites=true&w=majority';

console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI:', MONGODB_URI ? MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'Not set');

let db;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');

    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
    });

    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB successfully!');

    await db.command({ ping: 1 });
    console.log('✅ MongoDB ping successful');

    // Create indexes
    try {
      await db.collection('users').createIndex({ username: 1 }, { unique: true });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('projects').createIndex({ name: 'text', description: 'text' });
      await db.collection('checkins').createIndex({ message: 'text' });
      console.log('✅ Database indexes created');
    } catch (indexError) {
      console.log('ℹ️  Indexes may already exist:', indexError.message);
    }

    await initializeSampleData();

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    db = null;
  }
}

// Initialize sample data
async function initializeSampleData() {
  const usersCount = await db.collection('users').countDocuments();
  if (usersCount === 0) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create sample users
    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: hashedPassword,
        name: 'John Doe',
        bio: 'Full-stack developer passionate about open source',
        avatar: '/assets/images/dp.jpg',
        friends: ['jane_smith', 'mike_chen', 'sarah_wilson'],
        friendRequests: [],
        savedProjects: [],
        createdAt: new Date()
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: hashedPassword,
        name: 'Jane Smith',
        bio: 'Frontend developer and UI/UX enthusiast',
        avatar: '/assets/images/dp.jpg',
        friends: ['john_doe', 'alex_kumar'],
        friendRequests: [],
        savedProjects: [],
        createdAt: new Date()
      },
      {
        username: 'mike_chen',
        email: 'mike@example.com',
        password: hashedPassword,
        name: 'Mike Chen',
        bio: 'Backend developer specializing in Node.js',
        avatar: '/assets/images/dp.jpg',
        friends: ['john_doe', 'lisa_rodriguez'],
        friendRequests: [],
        savedProjects: [],
        createdAt: new Date()
      },
      {
        username: 'sarah_wilson',
        email: 'sarah@example.com',
        password: hashedPassword,
        name: 'Sarah Wilson',
        bio: 'Mobile app developer',
        avatar: '/assets/images/dp.jpg',
        friends: ['john_doe', 'david_brown'],
        friendRequests: [],
        savedProjects: [],
        createdAt: new Date()
      }
    ];

    await db.collection('users').insertMany(users);
    console.log('Sample users created');

    // Create sample projects
    const projects = [
      {
        name: 'E-commerce Website',
        description: 'A full-stack e-commerce platform with React and Node.js',
        type: 'web',
        hashtags: ['react', 'nodejs', 'mongodb'],
        image: '/assets/images/project1.jpg',
        owner: 'john_doe',
        members: ['john_doe', 'jane_smith'],
        files: [
          { name: 'package.json', path: '/', type: 'file', content: '{}' },
          { name: 'src', path: '/', type: 'folder' },
          { name: 'App.js', path: '/src', type: 'file', content: 'import React from "react";' }
        ],
        branches: ['main', 'development'],
        status: 'checked-in',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mobile Task Manager',
        description: 'A cross-platform task management app built with React Native',
        type: 'mobile',
        hashtags: ['react-native', 'javascript', 'productivity'],
        image: '/assets/images/project2.jpg',
        owner: 'jane_smith',
        members: ['jane_smith'],
        files: [
          { name: 'App.js', path: '/', type: 'file', content: 'import React from "react";' },
          { name: 'components', path: '/', type: 'folder' },
          { name: 'TaskList.js', path: '/components', type: 'file', content: 'const TaskList = () => {};' }
        ],
        branches: ['main'],
        status: 'checked-out',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const insertedProjects = await db.collection('projects').insertMany(projects);
    console.log('Sample projects created');

    // Create sample check-ins
    const checkins = [
      {
        projectId: insertedProjects.insertedIds[0],
        userId: 'john_doe',
        message: 'Initial project setup',
        comment: 'Created basic project structure with React and Node.js',
        files: ['/package.json', '/src/App.js'],
        branch: 'main',
        createdAt: new Date()
      },
      {
        projectId: insertedProjects.insertedIds[0],
        userId: 'jane_smith',
        message: 'Added authentication system',
        comment: 'Implemented JWT-based authentication with refresh tokens',
        files: ['/src/auth.js', '/src/middleware/auth.js'],
        branch: 'main',
        createdAt: new Date(Date.now() - 3600000)
      }
    ];

    await db.collection('checkins').insertMany(checkins);
    console.log('Sample check-ins created');
  }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  if (req.path === '/api/login' || req.path === '/api/signup') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not available' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.collection('users').findOne({ username: decoded.username });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Authentication Routes
app.post('/api/login', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please try again later.'
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const user = await db.collection('users').findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    const existingUser = await db.collection('users').findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      name: name || username,
      bio: '',
      avatar: '/assets/images/dp.jpg',
      friends: [],
      friendRequests: [],
      savedProjects: [],
      createdAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);

    const token = jwt.sign(
      { userId: result.insertedId, username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.insertedId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User Routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.user.username },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/users/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
      updateData.avatar = dataURI;
    }

    await db.collection('users').updateOne(
      { username: req.user.username },
      { $set: updateData }
    );

    const updatedUser = await db.collection('users').findOne(
      { username: req.user.username },
      { projection: { password: 0 } }
    );

    res.json({ 
      success: true, 
      message: 'Profile updated', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/users/:username', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.params.username },
      { projection: { password: 0, email: 0 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's friends with details
app.get('/api/users/:username/friends', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.params.username },
      { projection: { friends: 1 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const friends = await db.collection('users').find(
      { username: { $in: user.friends || [] } },
      { projection: { password: 0, email: 0, friendRequests: 0, friends: 0 } }
    ).toArray();

    res.json({ success: true, friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Friend Routes
app.get('/api/friends/requests', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.user.username },
      { projection: { friendRequests: 1 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const requestingUsers = await db.collection('users').find(
      { username: { $in: user.friendRequests || [] } },
      { projection: { password: 0, email: 0, friendRequests: 0, friends: 0 } }
    ).toArray();

    res.json({
      success: true,
      requests: user.friendRequests || [],
      users: requestingUsers
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/friends/request/:username', authenticateToken, async (req, res) => {
  try {
    const targetUser = await db.collection('users').findOne({
      username: req.params.username
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.username === req.user.username) {
      return res.status(400).json({ success: false, message: 'Cannot friend yourself' });
    }

    if (targetUser.friends.includes(req.user.username)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    if (targetUser.friendRequests.includes(req.user.username)) {
      return res.status(400).json({ success: false, message: 'Friend request already sent' });
    }

    await db.collection('users').updateOne(
      { username: req.params.username },
      { $push: { friendRequests: req.user.username } }
    );

    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/friends/accept/:username', authenticateToken, async (req, res) => {
  try {
    await db.collection('users').updateOne(
      { username: req.user.username },
      {
        $pull: { friendRequests: req.params.username },
        $push: { friends: req.params.username }
      }
    );

    await db.collection('users').updateOne(
      { username: req.params.username },
      { $push: { friends: req.user.username } }
    );

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/friends/:username', authenticateToken, async (req, res) => {
  try {
    await db.collection('users').updateOne(
      { username: req.user.username },
      { $pull: { friends: req.params.username } }
    );

    await db.collection('users').updateOne(
      { username: req.params.username },
      { $pull: { friends: req.user.username } }
    );

    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Project Routes
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await db.collection('projects').find({}).toArray();
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    let project;

    project = await db.collection('projects').findOne({
      name: req.params.id
    });

    if (!project && ObjectId.isValid(req.params.id)) {
      project = await db.collection('projects').findOne({
        _id: new ObjectId(req.params.id)
      });
    }

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { name, description, type, hashtags, image } = req.body;

    const newProject = {
      name,
      description,
      type: type || 'web',
      hashtags: hashtags || [],
      image: image || '/assets/images/default-project.jpg',
      owner: req.user.username,
      members: [req.user.username],
      files: [],
      branches: ['main'],
      status: 'checked-in',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('projects').insertOne(newProject);

    res.status(201).json({
      success: true,
      message: 'Project created',
      project: { ...newProject, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username && !project.members.includes(req.user.username)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updateData = { ...req.body, updatedAt: new Date() };
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Project updated' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await db.collection('projects').deleteOne({ _id: new ObjectId(req.params.id) });
    await db.collection('checkins').deleteMany({ projectId: new ObjectId(req.params.id) });

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Project Member Management
app.post('/api/projects/:id/members', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username) {
      return res.status(403).json({ success: false, message: 'Only project owner can add members' });
    }

    // Check if user is friend
    const currentUser = await db.collection('users').findOne({ username: req.user.username });
    if (!currentUser.friends.includes(username)) {
      return res.status(400).json({ success: false, message: 'Can only add friends as members' });
    }

    // Check if user exists
    const newMember = await db.collection('users').findOne({ username });
    if (!newMember) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (project.members.includes(username)) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { members: username } }
    );

    res.json({ success: true, message: 'Member added to project' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/projects/:id/members/:username', authenticateToken, async (req, res) => {
  try {
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username) {
      return res.status(403).json({ success: false, message: 'Only project owner can remove members' });
    }

    if (req.params.username === project.owner) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    }

    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $pull: { members: req.params.username } }
    );

    res.json({ success: true, message: 'Member removed from project' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/projects/:id/transfer-ownership', authenticateToken, async (req, res) => {
  try {
    const { newOwner } = req.body;
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username) {
      return res.status(403).json({ success: false, message: 'Only project owner can transfer ownership' });
    }

    // Check if new owner is a member
    if (!project.members.includes(newOwner)) {
      return res.status(400).json({ success: false, message: 'New owner must be a project member' });
    }

    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { owner: newOwner } }
    );

    res.json({ success: true, message: 'Project ownership transferred' });
  } catch (error) {
    console.error('Transfer ownership error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Project Files Management
app.post('/api/projects/:id/files', authenticateToken, async (req, res) => {
  try {
    const { file } = req.body;
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username && !project.members.includes(req.user.username)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { files: file } }
    );

    res.json({ success: true, message: 'File added to project' });
  } catch (error) {
    console.error('Add file error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/projects/:id/files/:filename', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username && !project.members.includes(req.user.username)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update file content
    const updatedFiles = project.files.map(file => 
      file.name === req.params.filename ? { ...file, content } : file
    );

    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { files: updatedFiles } }
    );

    res.json({ success: true, message: 'File updated' });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/projects/:id/files/:filename', authenticateToken, async (req, res) => {
  try {
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username && !project.members.includes(req.user.username)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedFiles = project.files.filter(file => file.name !== req.params.filename);

    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { files: updatedFiles } }
    );

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Project Status Management
app.post('/api/projects/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username && !project.members.includes(req.user.username)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'checked-out', updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'Project checked out' });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/projects/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const { message, comment, files, branch } = req.body;
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username && !project.members.includes(req.user.username)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Create check-in record
    const newCheckin = {
      projectId: new ObjectId(req.params.id),
      userId: req.user.username,
      message,
      comment: comment || '',
      files: files || [],
      branch: branch || 'main',
      createdAt: new Date()
    };

    await db.collection('checkins').insertOne(newCheckin);

    // Update project status
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'checked-in', updatedAt: new Date() } }
    );

    res.status(201).json({ success: true, message: 'Check-in created', checkin: newCheckin });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Save/Unsave Projects
app.post('/api/projects/:id/save', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    await db.collection('users').updateOne(
      { username: req.user.username },
      { 
        $addToSet: { savedProjects: new ObjectId(projectId) }
      }
    );

    res.json({ success: true, message: 'Project saved' });
  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/projects/:id/unsave', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    await db.collection('users').updateOne(
      { username: req.user.username },
      { 
        $pull: { savedProjects: new ObjectId(projectId) }
      }
    );

    res.json({ success: true, message: 'Project unsaved' });
  } catch (error) {
    console.error('Unsave project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/users/saved-projects', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.user.username },
      { projection: { savedProjects: 1 } }
    );

    let savedProjects = [];
    if (user.savedProjects && user.savedProjects.length > 0) {
      savedProjects = await db.collection('projects').find({
        _id: { $in: user.savedProjects }
      }).toArray();
    }

    res.json({ success: true, projects: savedProjects });
  } catch (error) {
    console.error('Get saved projects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check-in Routes
app.get('/api/projects/:id/checkins', authenticateToken, async (req, res) => {
  try {
    const checkins = await db.collection('checkins')
      .find({ projectId: new ObjectId(req.params.id) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, checkins });
  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Activity Feed Routes
app.get('/api/activity/global', authenticateToken, async (req, res) => {
  try {
    const checkins = await db.collection('checkins')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'username',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 50
        }
      ])
      .toArray();

    res.json({ success: true, activities: checkins });
  } catch (error) {
    console.error('Get global activity error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/activity/local', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ username: req.user.username });
    const friendUsernames = [...user.friends, req.user.username];

    const checkins = await db.collection('checkins')
      .aggregate([
        {
          $match: {
            userId: { $in: friendUsernames }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'username',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 50
        }
      ])
      .toArray();

    res.json({ success: true, activities: checkins });
  } catch (error) {
    console.error('Get local activity error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search Routes
app.get('/api/search', authenticateToken, async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    let results = {};

    if (!type || type === 'users') {
      const users = await db.collection('users').find({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } }
        ]
      }, { projection: { password: 0 } }).toArray();

      results.users = users;
    }

    if (!type || type === 'projects') {
      const projects = await db.collection('projects').find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { hashtags: { $in: [new RegExp(q, 'i')] } }
        ]
      }).toArray();

      results.projects = projects;
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    } else {
      next();
    }
  });
}

// Initialize database connection and start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;