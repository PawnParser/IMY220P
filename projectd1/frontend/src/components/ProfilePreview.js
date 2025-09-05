// Author u22857941 : Christopher Yoko
import React from 'react';
import dpImage from '../assets/images/dp.jpg';
import './ProfilePreview.css';

const ProfilePreview = ({ user }) => {
  return (
    <div className="profile-preview">
      <img src={dpImage} alt={user.name} className="profile-preview-avatar" />
      <div className="profile-preview-info">
        <h4>{user.name}</h4>
        <p>{user.bio || 'No bio available'}</p>
      </div>
    </div>
  );
};

export default ProfilePreview;