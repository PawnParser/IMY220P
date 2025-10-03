// Author u22857941 : Christopher Yoko
import React from 'react';
import { Link } from 'react-router-dom';
import dpImage from '../assets/images/dp.jpg';
import './FriendList.css';

const FriendList = ({ friends }) => {
  return (
    <div className="friend-list">
      <h3>Friends</h3>
      <div className="friends-section">
        <h4>Online</h4>
        {friends.online.map(friend => (
          <Link 
            key={friend.id} 
            to={`/profile/${friend.name}`}
            className="friend-item-link"
          >
            <div className="friend-item">
              <img src={dpImage} alt={friend.name} className="friend-avatar" />
              <span className="friend-name">{friend.name}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="friends-section">
        <h4>Offline</h4>
        {friends.offline.map(friend => (
          <Link 
            key={friend.id} 
            to={`/profile/${friend.name}`}
            className="friend-item-link"
          >
            <div className="friend-item offline">
              <img src={dpImage} alt={friend.name} className="friend-avatar" />
              <span className="friend-name">{friend.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FriendList;