// Author u22857941 : Christopher Yoko
import React from 'react';
import dpImage from '../assets/images/dp.jpg';
import './Profile.css';

const Profile = ({ data }) => {
  return (
    <div className="profile">
      <div className="profile-header">
        <img src={dpImage} alt={data.name} className="profile-avatar" />
        <div className="profile-info">
          <h1>{data.name}</h1>
          <button className="edit-profile-btn">Edit Profile</button>
        </div>
      </div>
      
      <div className="profile-stats">
        <div className="stat">
          <span className="stat-number">{data.friends}</span>
          <span className="stat-label">Friends</span>
        </div>
        <div className="stat">
          <span className="stat-number">{data.projects}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat">
          <span className="stat-number">{data.teams}</span>
          <span className="stat-label">Teams</span>
        </div>
        <div className="stat">
          <span className="stat-number">{data.views}</span>
          <span className="stat-label">Views</span>
        </div>
      </div>
      
      <div className="profile-about">
        <h3>About</h3>
        <p>{data.about}</p>
      </div>
    </div>
  );
};

export default Profile;