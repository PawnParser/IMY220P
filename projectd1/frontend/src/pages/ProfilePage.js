import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import Profile from '../components/Profile';
import ProjectList from '../components/ProjectList';
import FriendList from '../components/FriendList';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [userFriends, setUserFriends] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const { currentUser } = useAuth();

  useEffect(() => {
    loadProfileData();
  }, [id, currentUser]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!currentUser) {
        console.error('No current user found');
        navigate('/home');
        return;
      }

      let userData;
      let targetUsername = id;

      console.log('Loading profile for:', { id, currentUser: currentUser.username });

      // Determine if we're viewing own profile or someone else's
      if (!targetUsername || targetUsername === 'me' || targetUsername === currentUser.username) {
        // Viewing own profile
        console.log('Viewing own profile');
        const response = await apiService.getProfile(token);
        if (response.success) {
          userData = response.user;
          setIsOwner(true);
          setIsFriend(false);
          setHasSentRequest(false);
          targetUsername = userData.username;
        }
      } else {
        // Viewing someone else's profile
        console.log('Viewing other profile:', targetUsername);
        const response = await apiService.getUser(targetUsername, token);
        if (response.success) {
          userData = response.user;
          setIsOwner(false);
          
          // Check friendship status
          const currentUserResponse = await apiService.getProfile(token);
          if (currentUserResponse.success) {
            const currentUserFriends = currentUserResponse.user.friends || [];
            const friendshipStatus = currentUserFriends.includes(targetUsername);
            console.log('Friendship status:', friendshipStatus);
            setIsFriend(friendshipStatus);
            
            // Check if request was sent (only check if not friends)
            if (!friendshipStatus) {
              const targetUserResponse = await apiService.getUser(targetUsername, token);
              if (targetUserResponse.success) {
                const targetUserFriendRequests = targetUserResponse.user.friendRequests || [];
                const requestStatus = targetUserFriendRequests.includes(currentUser.username);
                console.log('Request status:', requestStatus);
                setHasSentRequest(requestStatus);
              }
            } else {
              setHasSentRequest(false);
            }
          }
        } else {
          console.error('User not found:', targetUsername);
          navigate('/home');
          return;
        }
      }

      if (userData) {
        console.log('Setting profile data for:', userData.username);
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

        // ALWAYS load projects for the target user
        const projectsResponse = await apiService.getProjects(token);
        if (projectsResponse.success) {
          const userProjects = projectsResponse.projects.filter(
            project => project.owner === targetUsername
          );
          console.log('Found projects:', userProjects.length, 'for user:', targetUsername);
          setUserProjects(userProjects);
          setProfileData(prev => ({
            ...prev,
            projects: userProjects.length
          }));
        }

        // ONLY load friends if viewing own profile
        if (isOwner) {
          const friendsResponse = await apiService.getUserFriends(targetUsername, token);
          if (friendsResponse.success) {
            const formattedFriends = {
              online: friendsResponse.friends.map(friend => ({
                id: friend._id,
                username: friend.username,
                name: friend.name,
                avatar: friend.avatar,
                online: Math.random() > 0.5
              })),
              offline: []
            };
            setUserFriends(formattedFriends);
          }
        }
      } else {
        console.error('User data not found');
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
      const formData = new FormData();

      formData.append('name', editForm.name);
      formData.append('bio', editForm.bio);
      if (selectedImage) {
        formData.append('avatar', selectedImage);
      }

      const response = await apiService.updateProfile(formData, token, true);

      if (response.success) {
        setProfileData(prev => ({
          ...prev,
          name: editForm.name,
          bio: editForm.bio,
          about: editForm.bio,
          avatar: response.user?.avatar || previewImage || profileData.avatar
        }));

        setIsEditing(false);
        setSelectedImage(null);
        setPreviewImage(null);
        loadProfileData();
      } else {
        alert('Failed to update profile: ' + response.message);
      }
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  const handleFriendAction = async (action) => {
    try {
      const token = localStorage.getItem('token');
      
      // Get the actual target username from the URL parameter
      const targetUsername = id;
      
      console.log('Friend action:', action, 'on user:', targetUsername, 'current user:', currentUser.username);
      
      if (targetUsername === currentUser.username) {
        alert('You cannot friend yourself.');
        return;
      }

      let response;

      if (action === 'add') {
        response = await apiService.sendFriendRequest(targetUsername, token);
        if (response && response.success) {
          setHasSentRequest(true);
          alert('Friend request sent!');
        }
      } else if (action === 'remove') {
        response = await apiService.removeFriend(targetUsername, token);
        if (response && response.success) {
          setIsFriend(false);
          setHasSentRequest(false);
          alert('Friend removed');
        }
      }
      loadProfileData(); // Reload to update status
    } catch (error) {
      console.error('Friend action error:', error);
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
          <form
            onSubmit={handleEditSubmit}
            className="edit-profile-form"
            encType="multipart/form-data"
          >
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label>Bio:</label>
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Profile Picture:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedImage(file);
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }}
              />

              {(previewImage || profileData?.avatar) && (
                <div className="image-preview">
                  <img
                    src={previewImage || profileData.avatar}
                    alt="Preview"
                  />
                  {selectedImage && <p>{selectedImage.name}</p>}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">Save</button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedImage(null);
                  setPreviewImage(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
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
                  <button
                    onClick={() => handleFriendAction('remove')}
                    className="unfriend-btn"
                  >
                    Remove Friend
                  </button>
                ) : hasSentRequest ? (
                  <button className="request-sent-btn" disabled>
                    Friend Request Sent
                  </button>
                ) : (
                  <button
                    onClick={() => handleFriendAction('add')}
                    className="friend-btn"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Profile data={profileData} />

      {/* Tabs - Always show Projects, only show Friends for own profile */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          Projects ({userProjects.length})
        </button>
        {isOwner && (
          <button 
            className={activeTab === 'friends' ? 'active' : ''}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({profileData.friends})
          </button>
        )}
      </div>

      <div className="profile-content">
        {/* ALWAYS show projects for any profile */}
        {activeTab === 'projects' && (
          <div className="profile-projects">
            <div className="projects-header">
              <h2>{isOwner ? 'Your Projects' : `${profileData.name}'s Projects`}</h2>
              {isOwner && (
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
                <p>{isOwner ? 'You have no projects yet.' : 'This user has no projects yet.'}</p>
                {isOwner && (
                  <button 
                    onClick={() => navigate('/home')}
                    className="create-project-btn-small"
                  >
                    Create your first project
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ONLY show friends when viewing own profile */}
        {activeTab === 'friends' && isOwner && (
          <div className="profile-friends">
            <div className="friends-header">
              <h2>Your Friends</h2>
              <span className="count-badge">{profileData.friends}</span>
            </div>
            {userFriends.online && userFriends.online.length > 0 ? (
              <FriendList friends={userFriends} />
            ) : (
              <div className="no-data">
                <p>You don't have any friends yet.</p>
                <p>Search for users and send them friend requests!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;