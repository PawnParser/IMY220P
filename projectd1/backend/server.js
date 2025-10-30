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

    // Create indexes with better error handling
    await createIndexes();
    await initializeSampleData();

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    db = null;
  }
}

// Improved index creation
async function createIndexes() {
  try {
    // Drop existing problematic indexes first
    try {
      await db.collection('users').dropIndex('username_1');
      console.log('✅ Dropped old username index');
    } catch (e) {
      console.log('ℹ️  No old username index to drop');
    }

    try {
      await db.collection('users').dropIndex('email_1');
      console.log('✅ Dropped old email index');
    } catch (e) {
      console.log('ℹ️  No old email index to drop');
    }

    // Create new indexes without sparse property
    await db.collection('users').createIndex(
      { username: 1 }, 
      { unique: true, name: 'username_unique' }
    );
    console.log('✅ Created username index');

    await db.collection('users').createIndex(
      { email: 1 }, 
      { unique: true, name: 'email_unique' }
    );
    console.log('✅ Created email index');

    // Text indexes for search
    await db.collection('projects').createIndex(
      { name: 'text', description: 'text' },
      { name: 'projects_text_search' }
    );
    console.log('✅ Created projects text index');

    await db.collection('checkins').createIndex(
      { message: 'text' },
      { name: 'checkins_text_search' }
    );
    console.log('✅ Created checkins text index');

    await db.collection('messages').createIndex(
      { sender: 1, receiver: 1, createdAt: -1 },
      { name: 'messages_conversation' }
    );
    console.log('✅ Created messages index');

  } catch (error) {
    console.log('ℹ️  Indexes may already exist or could not be created:', error.message);
  }
}

// Ensure admin user exists
async function ensureAdminUser() {
  try {
    const adminUser = await db.collection('users').findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('👑 Creating admin user...');
      const adminHashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.collection('users').insertOne({
        username: 'admin',
        email: 'admin@codelink.com',
        password: adminHashedPassword,
        name: 'System Administrator',
        bio: 'System administrator with full access',
        avatar: '/assets/images/dp.jpg',
        friends: [],
        friendRequests: [],
        savedProjects: [],
        role: 'admin',
        createdAt: new Date()
      });
      
      console.log('✅ Admin user created successfully');
      console.log('🔐 ADMIN LOGIN CREDENTIALS:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email: admin@codelink.com');
    } else {
      console.log('✅ Admin user already exists');
      console.log('🔐 ADMIN LOGIN CREDENTIALS:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  }
}

// Initialize sample data with admin user
async function initializeSampleData() {
  try {
    // First, ensure admin user exists
    await ensureAdminUser();
    
    const usersCount = await db.collection('users').countDocuments();
    
    if (usersCount <= 1) { // Only admin exists or no users
      console.log('📦 Initializing sample data...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Create sample users (excluding admin since we already created it)
      const users = [
        {
          username: 'john_doe',
          email: 'john@example.com',
          password: hashedPassword,
          name: 'John Doe',
          bio: 'Full-stack developer passionate about open source',
          avatar: '/assets/images/dp.jpg',
          friends: ['jane_smith', 'mike_chen'],
          friendRequests: [],
          savedProjects: [],
          role: 'user',
          createdAt: new Date()
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          password: hashedPassword,
          name: 'Jane Smith',
          bio: 'Frontend developer and UI/UX enthusiast',
          avatar: '/assets/images/dp.jpg',
          friends: ['john_doe'],
          friendRequests: [],
          savedProjects: [],
          role: 'user',
          createdAt: new Date()
        }
      ];

      const usersResult = await db.collection('users').insertMany(users);
      console.log(`✅ Created ${usersResult.insertedCount} sample users`);

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
            { 
              name: 'package.json', 
              path: '/', 
              type: 'file', 
              content: JSON.stringify({
                "name": "ecommerce-website",
                "version": "1.0.0",
                "dependencies": {
                  "react": "^18.0.0",
                  "express": "^4.18.0"
                }
              }, null, 2)
            }
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
            { 
              name: 'App.js', 
              path: '/', 
              type: 'file', 
              content: `import React from 'react';\nimport { View, Text } from 'react-native';\n\nconst App = () => {\n  return (\n    <View>\n      <Text>Task Manager App</Text>\n    </View>\n  );\n};\n\nexport default App;`
            }
          ],
          branches: ['main'],
          status: 'checked-out',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const projectsResult = await db.collection('projects').insertMany(projects);
      console.log(`✅ Created ${projectsResult.insertedCount} sample projects`);

      // Create sample check-ins
      const checkins = [
        {
          projectId: projectsResult.insertedIds[0],
          userId: 'john_doe',
          message: 'Initial project setup',
          comment: 'Created basic project structure with React and Node.js',
          files: ['/package.json', '/src/App.js'],
          branch: 'main',
          createdAt: new Date()
        },
        {
          projectId: projectsResult.insertedIds[0],
          userId: 'jane_smith',
          message: 'Added authentication system',
          comment: 'Implemented JWT-based authentication with refresh tokens',
          files: ['/src/auth.js', '/src/middleware/auth.js'],
          branch: 'main',
          createdAt: new Date(Date.now() - 3600000)
        }
      ];

      await db.collection('checkins').insertMany(checkins);
      console.log('✅ Created sample check-ins');

      // Create sample messages
      const messages = [
        {
          sender: 'john_doe',
          receiver: 'jane_smith',
          content: 'Hey Jane, want to collaborate on the e-commerce project?',
          createdAt: new Date(Date.now() - 86400000),
          read: true
        },
        {
          sender: 'jane_smith',
          receiver: 'john_doe',
          content: 'Sure John! I can help with the frontend React components.',
          createdAt: new Date(Date.now() - 86300000),
          read: true
        }
      ];

      await db.collection('messages').insertMany(messages);
      console.log('✅ Created sample messages');

    } else {
      console.log('✅ Sample data already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
  }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  if (req.path === '/api/login' || req.path === '/api/signup' || req.path === '/api/create-admin') {
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

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
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
      { userId: user._id, username: user.username, role: user.role },
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
        role: user.role,
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
      role: 'user',
      createdAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);

    const token = jwt.sign(
      { userId: result.insertedId, username, role: 'user' },
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
        role: newUser.role,
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin creation endpoint (temporary - can be removed after use)
app.post('/api/create-admin', async (req, res) => {
  try {
    await ensureAdminUser();
    res.json({ 
      success: true, 
      message: 'Admin user ensured',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
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

// Get user's saved projects - FIXED ENDPOINT
app.get('/api/users/saved-projects', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.user.username },
      { projection: { savedProjects: 1 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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

    // First try to find by name
    project = await db.collection('projects').findOne({
      name: req.params.id
    });

    // If not found by name, try by ID
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

    // Check if project name already exists
    const existingProject = await db.collection('projects').findOne({ name });
    if (existingProject) {
      return res.status(400).json({ success: false, message: 'Project name already exists' });
    }

    const newProject = {
      name,
      description,
      type: type || 'web',
      hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
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

    // Allow admin or project owner/member to update
    if (req.user.role !== 'admin' && project.owner !== req.user.username && !project.members.includes(req.user.username)) {
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

    // Allow admin or project owner to delete
    if (req.user.role !== 'admin' && project.owner !== req.user.username) {
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

    if (project.owner !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owner or admin can add members' });
    }

    // Check if user is friend (unless admin)
    if (req.user.role !== 'admin') {
      const currentUser = await db.collection('users').findOne({ username: req.user.username });
      if (!currentUser.friends.includes(username)) {
        return res.status(400).json({ success: false, message: 'Can only add friends as members' });
      }
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

    if (project.owner !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owner or admin can remove members' });
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

// Check-in Routes
app.post('/api/projects/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const { message, comment, files, branch } = req.body;
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner !== req.user.username && !project.members.includes(req.user.username) && req.user.role !== 'admin') {
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

// Messaging Routes
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const messages = await db.collection('messages')
      .find({
        $or: [
          { sender: req.user.username },
          { receiver: req.user.username }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Group by conversation and get last message
    const conversations = {};
    messages.forEach(message => {
      const otherUser = message.sender === req.user.username ? message.receiver : message.sender;
      if (!conversations[otherUser] || message.createdAt > conversations[otherUser].lastMessageTime) {
        conversations[otherUser] = {
          friendUsername: otherUser,
          lastMessage: message.content,
          lastMessageTime: message.createdAt
        };
      }
    });

    // Get user details for each conversation
    const conversationList = await Promise.all(
      Object.values(conversations).map(async (convo) => {
        const user = await db.collection('users').findOne(
          { username: convo.friendUsername },
          { projection: { name: 1, avatar: 1 } }
        );
        return {
          ...convo,
          friendName: user?.name || convo.friendUsername,
          friendAvatar: user?.avatar || '/assets/images/dp.jpg'
        };
      })
    );

    res.json({ success: true, conversations: conversationList });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/messages/:friendUsername', authenticateToken, async (req, res) => {
  try {
    const messages = await db.collection('messages')
      .find({
        $or: [
          { sender: req.user.username, receiver: req.params.friendUsername },
          { sender: req.params.friendUsername, receiver: req.user.username }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray();

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/messages/:friendUsername', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    // Check if users are friends
    const user = await db.collection('users').findOne({ username: req.user.username });
    if (!user.friends.includes(req.params.friendUsername) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Can only message friends' });
    }

    const newMessage = {
      sender: req.user.username,
      receiver: req.params.friendUsername,
      content,
      createdAt: new Date(),
      read: false
    };

    await db.collection('messages').insertOne(newMessage);

    res.status(201).json({ success: true, message: 'Message sent', message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/users/:username', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, bio, role } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (role) updateData.role = role;

    await db.collection('users').updateOne(
      { username: req.params.username },
      { $set: updateData }
    );

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/admin/users/:username', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.username === req.user.username) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await db.collection('users').deleteOne({ username: req.params.username });
    
    // Also remove user from projects and messages
    await db.collection('projects').updateMany(
      { members: req.params.username },
      { $pull: { members: req.params.username } }
    );
    
    await db.collection('messages').deleteMany({
      $or: [
        { sender: req.params.username },
        { receiver: req.params.username }
      ]
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/projects', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const projects = await db.collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Admin get projects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Project updated successfully' });
  } catch (error) {
    console.error('Admin update project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/admin/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.collection('projects').deleteOne({ _id: new ObjectId(req.params.id) });
    await db.collection('checkins').deleteMany({ projectId: new ObjectId(req.params.id) });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Admin delete project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/checkins', authenticateToken, requireAdmin, async (req, res) => {
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
        }
      ])
      .toArray();

    res.json({ success: true, checkins });
  } catch (error) {
    console.error('Admin get checkins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/checkins/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message, comment } = req.body;
    const updateData = {};
    
    if (message) updateData.message = message;
    if (comment !== undefined) updateData.comment = comment;

    await db.collection('checkins').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Check-in updated successfully' });
  } catch (error) {
    console.error('Admin update checkin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/admin/checkins/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.collection('checkins').deleteOne({ _id: new ObjectId(req.params.id) });

    res.json({ success: true, message: 'Check-in deleted successfully' });
  } catch (error) {
    console.error('Admin delete checkin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        status: 'error',
        message: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    await db.command({ ping: 1 });

    res.json({
      status: 'ok',
      message: 'Server and database are healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Admin email: admin@codelink.com`);
    console.log(`🔑 Admin password: admin123`);
  });
});

module.exports = app;