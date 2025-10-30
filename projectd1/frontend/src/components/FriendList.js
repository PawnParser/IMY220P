// Author u22857941 : Christopher Yoko
import React from 'react';
import { Link } from 'react-router-dom';
import dpImage from '../assets/images/dp.jpg';
import './FriendList.css';

const FriendList = ({ friends }) => {
  return (
    <div className="friend-list">
      <div className="friends-section">
        <h4>Online ({friends.online.length})</h4>
        {friends.online.length > 0 ? (
          friends.online.map(friend => (
            <Link 
              key={friend.id} 
              to={`/profile/${friend.username}`}
              className="friend-item-link"
            >
              <div className="friend-item">
                <img 
                  src={friend.avatar || dpImage} 
                  alt={friend.name} 
                  className="friend-avatar" 
                  onError={(e) => {
                    e.target.src = dpImage;
                  }}
                />
                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-username">@{friend.username}</span>
                </div>
                <div className="online-indicator"></div>
              </div>
            </Link>
          ))
        ) : (
          <p className="no-friends">No friends online</p>
        )}
      </div>
      <div className="friends-section">
        <h4>Offline ({friends.offline.length})</h4>
        {friends.offline.length > 0 ? (
          friends.offline.map(friend => (
            <Link 
              key={friend.id} 
              to={`/profile/${friend.username}`}
              className="friend-item-link"
            >
              <div className="friend-item offline">
                <img 
                  src={friend.avatar || dpImage} 
                  alt={friend.name} 
                  className="friend-avatar" 
                  onError={(e) => {
                    e.target.src = dpImage;
                  }}
                />
                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-username">@{friend.username}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="no-friends">No friends offline</p>
        )}
      </div>
    </div>
  );
};

export default FriendList;