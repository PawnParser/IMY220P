// Author u22857941 : Christopher Yoko
import React from 'react';
import dpImage from '../assets/images/dp.jpg';
import './Feed.css';

const Feed = ({ items }) => {
  return (
    <div className="feed">
      {items.map(item => (
        <div key={item.id} className="feed-item">
          <div className="feed-header">
            <img src={dpImage} alt={item.user} className="feed-avatar" />
            <div className="feed-user-info">
              <span className="feed-username">{item.user}</span>
              <span className="project-name">in {item.project}</span>
            </div>
          </div>
          <div className="feed-content">
            <p className="feed-message">{item.message}</p>
            <p className="feed-comment">{item.comment}</p>
          </div>
          <div className="feed-footer">
            <span className="feed-time">{item.time}</span>
            <div className="feed-actions">
              <button>Like</button>
              <button>Comment</button>
              <button>Share</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Feed;