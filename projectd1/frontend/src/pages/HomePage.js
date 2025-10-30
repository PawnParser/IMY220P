import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Link } from 'react-router-dom';
import Feed from '../components/Feed';
import FriendList from '../components/FriendList';
import FriendRequests from '../components/FriendRequests';
import ProjectList from '../components/ProjectList';
import CreateProject from '../components/CreateProject';
import './HomePage.css';

const HomePage = () => {
  const [activeFeed, setActiveFeed] = useState('local');
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [friends, setFriends] = useState({ online: [], offline: [] });
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, [activeFeed]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Load projects
      const projectsResponse = await apiService.getProjects(token);
      if (projectsResponse.success) {
        console.log('Loaded projects:', projectsResponse.projects);
        setProjects(projectsResponse.projects);
      } else {
        console.error('Failed to load projects:', projectsResponse.message);
        setProjects([]);
      }

      // Load friend requests
      try {
        const requestsResponse = await apiService.getFriendRequests(token);
        if (requestsResponse.success) {
          setFriendRequests(requestsResponse.users || []);
        }
      } catch (requestsError) {
        console.log('Friend requests not available:', requestsError.message);
        setFriendRequests([]);
      }

      // Load activities
      try {
        const activityResponse = activeFeed === 'local' 
          ? await apiService.getLocalActivity(token)
          : await apiService.getGlobalActivity(token);
        
        if (activityResponse.success) {
          console.log('Loaded activities:', activityResponse.activities);
          const formattedActivities = activityResponse.activities.map(activity => ({
            id: activity._id,
            user: activity.user && activity.user[0] ? activity.user[0].name : activity.userId,
            userAvatar: activity.user && activity.user[0] ? activity.user[0].avatar : null,
            project: activity.project && activity.project[0] ? activity.project[0].name : 'Unknown Project',
            message: activity.message,
            comment: activity.comment,
            time: new Date(activity.createdAt).toLocaleDateString()
          }));
          setActivities(formattedActivities);
        }
      } catch (activityError) {
        console.log('Activities not available yet, using sample data');
        setActivities([
          {
            id: 1,
            user: 'john_doe',
            userAvatar: null,
            project: 'E-commerce Website',
            message: 'Implemented user authentication',
            comment: 'Added JWT-based authentication system',
            time: '2 hours ago'
          }
        ]);
      }

      // Load friends with actual data
      try {
        const profileResponse = await apiService.getProfile(token);
        if (profileResponse.success && profileResponse.user.friends) {
          // Get friend details
          const friendsResponse = await apiService.getUserFriends(currentUser.username, token);
          if (friendsResponse.success) {
            const friendList = friendsResponse.friends.map((friend, index) => ({
              id: friend._id || index,
              username: friend.username,
              name: friend.name,
              avatar: friend.avatar,
              online: Math.random() > 0.5 // Simulate online status
            }));
            
            setFriends({
              online: friendList.filter(f => f.online),
              offline: friendList.filter(f => !f.online)
            });
          }
        }
      } catch (friendError) {
        console.log('Friends not available, using sample data');
        setFriends({
          online: [{ id: 1, username: 'jane_smith', name: 'Jane Smith', avatar: null, online: true }],
          offline: [{ id: 2, username: 'john_doe', name: 'John Doe', avatar: null, online: false }]
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setShowCreateProject(false);
    loadData();
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Welcome back, {currentUser?.name}!</h1>
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateProject(true)}
            className="create-project-btn"
          >
            + Create Project
          </button>
        </div>
      </div>
      
      {showCreateProject && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button 
                onClick={() => setShowCreateProject(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <CreateProject onProjectCreated={handleProjectCreated} />
          </div>
        </div>
      )}
      
      <div className="home-content">
        <div className="main-content card">
          <div className="section-header">
            <h2>Activity Feed</h2>
            <div className="feed-controls">
              <button 
                className={activeFeed === 'local' ? 'active' : ''}
                onClick={() => setActiveFeed('local')}
              >
                Friends
              </button>
              <button 
                className={activeFeed === 'global' ? 'active' : ''}
                onClick={() => setActiveFeed('global')}
              >
                Global
              </button>
            </div>
          </div>
          
          {activities.length > 0 ? (
            <Feed items={activities} />
          ) : (
            <div className="no-data">
              <p>No activities found. Create a project or check in some changes!</p>
            </div>
          )}
        </div>
        
        <div className="sidebar">
          {/* Friend Requests Section */}
          {friendRequests.length > 0 && (
            <div className="sidebar-section card">
              <FriendRequests 
                requests={friendRequests} 
                onUpdate={loadData} 
              />
            </div>
          )}
          
          <div className="sidebar-section card">
            <div className="section-header">
              <h3>Your Projects</h3>
              <span className="count-badge">{projects.length}</span>
            </div>
            {projects.length > 0 ? (
              <ProjectList projects={projects} />
            ) : (
              <div className="no-data">
                <p>No projects yet.</p>
                <button 
                  onClick={() => setShowCreateProject(true)}
                  className="create-project-btn-small"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
          
          <div className="sidebar-section card">
            <div className="section-header">
              <h3>Friends</h3>
              <span className="count-badge">{friends.online.length + friends.offline.length}</span>
            </div>
            <FriendList friends={friends} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;