import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import Profile from '../components/Profile';
import ProjectList from '../components/ProjectList';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadProfileData();
  }, [id]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      let userData;
      let targetUsername = id;

      // If no ID specified or it's "me", use current user
      if (!targetUsername || targetUsername === 'me') {
        const response = await apiService.getProfile(token);
        if (response.success) {
          userData = response.user;
          setIsOwner(true);
          targetUsername = userData.username;
        }
      } else {
        // Viewing other user's profile
        const response = await apiService.getUser(targetUsername, token);
        if (response.success) {
          userData = response.user;
          const isCurrentUser = currentUser?.username === targetUsername;
          setIsOwner(isCurrentUser);
          
          // Check if already friends (only if not the current user)
          if (!isCurrentUser && currentUser) {
            const currentUserResponse = await apiService.getProfile(token);
            if (currentUserResponse.success) {
              const currentUserFriends = currentUserResponse.user.friends || [];
              setIsFriend(currentUserFriends.includes(targetUsername));
              
              // Check if friend request already sent
              const targetUserResponse = await apiService.getUser(targetUsername, token);
              if (targetUserResponse.success) {
                const targetUserFriendRequests = targetUserResponse.user.friendRequests || [];
                setHasSentRequest(targetUserFriendRequests.includes(currentUser.username));
              }
            }
          }
        }
      }

      if (userData) {
        setProfileData({
          name: userData.name,
          bio: userData.bio,
          avatar: userData.avatar,
          friends: userData.friends?.length || 0,
          projects: 0,
          teams: 0,
          views: 0,
          about: userData.bio || 'No bio provided.'
        });

        setEditForm({
          name: userData.name,
          bio: userData.bio || ''
        });

        // Load user's projects
        const projectsResponse = await apiService.getProjects(token);
        if (projectsResponse.success) {
          const userProjects = projectsResponse.projects.filter(
            project => project.owner === targetUsername
          );
          setUserProjects(userProjects);
          
          // Update projects count
          setProfileData(prev => ({
            ...prev,
            projects: userProjects.length
          }));
        }
      } else {
        console.error('User not found');
        navigate('/home');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      navigate('/home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.updateProfile(editForm, token);
      
      if (response.success) {
        setProfileData(prev => ({
          ...prev,
          name: editForm.name,
          bio: editForm.bio,
          about: editForm.bio
        }));
        setIsEditing(false);
        loadProfileData(); // Reload to get updated data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

// In the handleFriendAction function, update the remove friend part:
const handleFriendAction = async (action) => {
  try {
    const token = localStorage.getItem('token');
    let response;
    
    if (action === 'add') {
      response = await apiService.sendFriendRequest(id, token);
      if (response && response.success) {
        setHasSentRequest(true);
        alert('Friend request sent!');
      }
    } else if (action === 'remove') {
      response = await apiService.removeFriend(id, token);
      if (response && response.success) {
        setIsFriend(false);
        setHasSentRequest(false);
        alert('Friend removed');
      }
    }
    
    // Reload profile data to get updated friend status
    loadProfileData();
  } catch (error) {
    console.error('Friend action error:', error);
    // Show user-friendly error message
    if (error.message && error.message.includes('Cannot friend yourself')) {
      alert('You cannot send a friend request to yourself.');
    } else if (error.message && error.message.includes('Already friends')) {
      alert('You are already friends with this user.');
    } else if (error.message && error.message.includes('Friend request already sent')) {
      alert('Friend request already sent.');
    } else {
      alert('An error occurred. Please try again.');
    }
  }
};
  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="error">Profile not found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header-section">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="edit-profile-form">
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Bio:</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn">Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-actions">
            {isOwner ? (
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                Edit Profile
              </button>
            ) : (
              <div className="friend-actions">
                {isFriend ? (
                  <button onClick={() => handleFriendAction('remove')} className="unfriend-btn">
                    Remove Friend
                  </button>
                ) : hasSentRequest ? (
                  <button className="request-sent-btn" disabled>
                    Friend Request Sent
                  </button>
                ) : (
                  <button onClick={() => handleFriendAction('add')} className="friend-btn">
                    Add Friend
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Profile data={profileData} />
      
      <div className="profile-projects">
        <div className="projects-header">
          <h2>Projects ({userProjects.length})</h2>
          {isOwner && !isEditing && (
            <button 
              onClick={() => navigate('/home')}
              className="create-project-btn"
            >
              Create a project
            </button>
          )}
        </div>
        {userProjects.length > 0 ? (
          <ProjectList projects={userProjects} />
        ) : (
          <div className="no-data">
            <p>No projects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;