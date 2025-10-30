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
const storage = multer.memoryStorage(); // Store files in memory as Buffer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// MongoDB Connection - Use environment variable or fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://u22857941:Sm9x38gRbDdL4hKt@imy220prac5.41pvu.mongodb.net/versioncontrol?retryWrites=true&w=majority';

console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI:', MONGODB_URI ? MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'Not set');

let db;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// In your server.js, replace the connectToDatabase function:
async function connectToDatabase() {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('Connection string:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide password

    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 15000, // 15 second connection timeout
      maxPoolSize: 10,
    });

    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB successfully!');

    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ MongoDB ping successful');

    // Check existing collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Existing collections:', collections.map(c => c.name));

    // Create indexes if they don't exist
    try {
      await db.collection('users').createIndex({ username: 1 }, { unique: true });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('projects').createIndex({ name: 'text', description: 'text' });
      await db.collection('checkins').createIndex({ message: 'text' });
      console.log('✅ Database indexes created');
    } catch (indexError) {
      console.log('ℹ️  Indexes may already exist:', indexError.message);
    }

    // Initialize sample data
    await initializeSampleData();

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.log('💡 Tips:');
    console.log('1. Check your MongoDB Atlas connection string');
    console.log('2. Make sure your IP is whitelisted in Atlas');
    console.log('3. Check if your password has special characters that need URL encoding');
    console.log('4. Verify your cluster is running in Atlas');

    // Don't exit the process, just log the error
    db = null;
  }
}

// Initialize sample data
async function initializeSampleData() {
  const usersCount = await db.collection('users').countDocuments();
  if (usersCount === 0) {
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: hashedPassword,
        name: 'John Doe',
        bio: 'Full-stack developer passionate about open source',
        avatar: '/assets/images/dp.jpg',
        friends: [],
        friendRequests: [],
        createdAt: new Date()
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: hashedPassword,
        name: 'Jane Smith',
        bio: 'Frontend developer and UI/UX enthusiast',
        avatar: '/assets/images/dp.jpg',
        friends: [],
        friendRequests: [],
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
          { name: 'package.json', path: '/', type: 'file' },
          { name: 'src', path: '/', type: 'folder' },
          { name: 'App.js', path: '/src', type: 'file' }
        ],
        branches: ['main', 'development'],
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
          { name: 'App.js', path: '/', type: 'file' },
          { name: 'components', path: '/', type: 'folder' },
          { name: 'TaskList.js', path: '/components', type: 'file' }
        ],
        branches: ['main'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const insertedProjects = await db.collection('projects').insertMany(projects);
    console.log('Sample projects created');

    // Create sample check-in messages
    const checkins = [
      {
        projectId: insertedProjects.insertedIds[0],
        userId: 'john_doe',
        message: 'Implemented user authentication system',
        comment: 'Added JWT-based authentication with refresh tokens',
        files: ['/src/auth.js', '/src/middleware/auth.js'],
        branch: 'main',
        createdAt: new Date()
      },
      {
        projectId: insertedProjects.insertedIds[0],
        userId: 'jane_smith',
        message: 'Fixed responsive design issues',
        comment: 'Improved mobile responsiveness across all components',
        files: ['/src/components/Header.js', '/src/components/Footer.js'],
        branch: 'main',
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        projectId: insertedProjects.insertedIds[1],
        userId: 'jane_smith',
        message: 'Added task completion functionality',
        comment: 'Users can now mark tasks as complete with animation',
        files: ['/components/TaskItem.js', '/components/TaskList.js'],
        branch: 'main',
        createdAt: new Date(Date.now() - 7200000) // 2 hours ago
      }
    ];

    await db.collection('checkins').insertMany(checkins);
    console.log('Sample check-ins created');
  }
}

// Authentication middleware
// In server.js, update the authenticateToken middleware:
const authenticateToken = async (req, res, next) => {
  // Skip authentication for login/signup routes
  if (req.path === '/api/login' || req.path === '/api/signup') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    // Check if MongoDB is connected
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
    // Check if MongoDB is connected
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

    console.log('Login attempt for user:', username);

    const user = await db.collection('users').findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);
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

    console.log('Login successful for user:', username);

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

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      name: name || username,
      bio: '',
      avatar: '/assets/images/dp.jpg',
      friends: [],
      friendRequests: [],
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

// Updated profile endpoint to handle file uploads
app.put('/api/users/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    // Handle avatar upload
    if (req.file) {
      // Convert image buffer to base64
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

    // Test database connection
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

app.get('/api/users/:username', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.params.username }, // Changed from _id to username
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

app.get('/api/friends/requests', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.user.username },
      { projection: { friendRequests: 1 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get details of users who sent friend requests
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

// Friend Routes
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

    // Check if already friends
    if (targetUser.friends.includes(req.user.username)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    // Check if request already sent
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
    const projects = await db.collection('projects').find({
      $or: [
        { owner: req.user.username },
        { members: req.user.username }
      ]
    }).toArray();

    res.json({ success: true, projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    let project;

    // First try to find by name (string)
    project = await db.collection('projects').findOne({
      name: req.params.id
    });

    // If not found by name, try by ObjectId
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
    const { name, description, type, hashtags, image, files } = req.body;

    const newProject = {
      name,
      description,
      type: type || 'web',
      hashtags: hashtags || [],
      image: image || '/assets/images/default-project.jpg',
      owner: req.user.username,
      members: [req.user.username],
      files: files || [],
      branches: ['main'],
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

    if (project.owner !== req.user.username) {
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

    // Also delete related check-ins
    await db.collection('checkins').deleteMany({ projectId: new ObjectId(req.params.id) });

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check-in Routes
app.post('/api/projects/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const { message, comment, files, branch } = req.body;

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

    // Update project's updatedAt
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { updatedAt: new Date() } }
    );

    res.status(201).json({ success: true, message: 'Check-in created', checkin: newCheckin });
  } catch (error) {
    console.error('Create checkin error:', error);
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

app.post('/api/init-data', async (req, res) => {
  try {
    await initializeSampleData();
    res.json({ success: true, message: 'Sample data initialized' });
  } catch (error) {
    console.error('Data initialization error:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize data' });
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
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }, { projection: { password: 0 } }).toArray();

      results.users = users;
    }

    if (!type || type === 'projects') {
      const projects = await db.collection('projects').find({
        $text: { $search: q }
      }).toArray();

      results.projects = projects;
    }

    if (!type || type === 'checkins') {
      const checkins = await db.collection('checkins')
        .find({ message: { $regex: q, $options: 'i' } })
        .sort({ createdAt: -1 })
        .toArray();

      results.checkins = checkins;
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

  // Use a parameterized catch-all route instead of plain '*'
  app.get('*', (req, res, next) => {
    // Only handle routes that don't start with /api
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    } else {
      next(); // Pass API routes to the next middleware
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