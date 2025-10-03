import React from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import './FriendRequests.css';

const FriendRequests = ({ requests, onUpdate }) => {
  const { currentUser } = useAuth();

  const handleAccept = async (username) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.acceptFriendRequest(username, token);
      
      if (response.success) {
        onUpdate(); // Refresh the data
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request: ' + error.message);
    }
  };

  const handleDecline = async (username) => {
    try {
      const token = localStorage.getItem('token');
      // You might want to add a decline endpoint to your server
      // For now, we'll just remove the request (this is a simple implementation)
      const response = await apiService.removeFriend(username, token);
      
      if (response.success) {
        onUpdate(); // Refresh the data
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  if (!requests || requests.length === 0) {
    return (
      <div className="friend-requests">
        <h3>Friend Requests</h3>
        <p>No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="friend-requests">
      <h3>Friend Requests ({requests.length})</h3>
      <div className="requests-list">
        {requests.map((request, index) => (
          <div key={index} className="request-item">
            <div className="request-info">
              <strong>{request.name || request.username}</strong>
              {request.bio && <p className="request-bio">{request.bio}</p>}
            </div>
            <div className="request-actions">
              <button 
                onClick={() => handleAccept(request.username)}
                className="accept-btn"
              >
                Accept
              </button>
              <button 
                onClick={() => handleDecline(request.username)}
                className="decline-btn"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;