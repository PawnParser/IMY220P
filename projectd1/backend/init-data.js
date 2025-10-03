require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

async function initializeData() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    console.log('Connected to MongoDB, initializing data...');
    
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('checkins').deleteMany({});
    
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
        friends: ['jane_smith'],
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
        friends: ['john_doe'],
        friendRequests: [],
        createdAt: new Date()
      }
    ];
    
    const userResult = await db.collection('users').insertMany(users);
    console.log('Sample users created:', userResult.insertedCount);
    
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
    
    const projectResult = await db.collection('projects').insertMany(projects);
    console.log('Sample projects created:', projectResult.insertedCount);
    
    // Create sample check-ins
    const checkins = [
      {
        projectId: projectResult.insertedIds[0],
        userId: 'john_doe',
        message: 'Implemented user authentication system',
        comment: 'Added JWT-based authentication with refresh tokens',
        files: ['/src/auth.js', '/src/middleware/auth.js'],
        branch: 'main',
        createdAt: new Date()
      },
      {
        projectId: projectResult.insertedIds[0],
        userId: 'jane_smith',
        message: 'Fixed responsive design issues',
        comment: 'Improved mobile responsiveness across all components',
        files: ['/src/components/Header.js', '/src/components/Footer.js'],
        branch: 'main',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        projectId: projectResult.insertedIds[1],
        userId: 'jane_smith',
        message: 'Added task completion functionality',
        comment: 'Users can now mark tasks as complete with animation',
        files: ['/components/TaskItem.js', '/components/TaskList.js'],
        branch: 'main',
        createdAt: new Date(Date.now() - 7200000)
      }
    ];
    
    const checkinResult = await db.collection('checkins').insertMany(checkins);
    console.log('Sample check-ins created:', checkinResult.insertedCount);
    
    console.log('Data initialization completed successfully!');
    console.log('You can now login with:');
    console.log('Username: john_doe, Password: password123');
    console.log('Username: jane_smith, Password: password123');
    
    await client.close();
  } catch (error) {
    console.error('Data initialization failed:', error);
  }
}

initializeData();