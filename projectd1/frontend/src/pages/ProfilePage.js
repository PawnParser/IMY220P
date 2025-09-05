// Author u22857941 : Christopher Yoko
import React from 'react';
import { useParams } from 'react-router-dom';
import Profile from '../components/Profile';
import ProjectList from '../components/ProjectList';
import FriendList from '../components/FriendList';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  
  // Dummy data
  const profileData = {
    id: id || '23532',
    name: 'Mr John Doe',
    friends: 0,
    projects: 34,
    teams: 7,
    views: '43K',
    about: 'Hey guys! Honestly I barely do any coding in fact my cactus plant does most of it for me. At night he grows hands and types out all of this wonderful code for me! In real life I am actually just a McDonald\'s worker and my hobbies include going to space and also going to Saunas.',
    teams: ['Cactus Coders', 'Space Devs'],
    topProjects: [
      { id: 1, name: 'AI to teach me how to read', stats: '20K | 4K | 23' },
      { id: 2, name: 'Shoe lace tying AI', stats: '15K | 3K | 18' }
    ]
  };

  const projects = [
    { id: 1, name: 'ScamWebsite', description: 'A website project' },
    { id: 2, name: 'GenerousPortfolio', description: 'Portfolio generator' },
    { id: 3, name: 'Shoe lace tying AI', description: 'AI to tie shoelaces' },
    { id: 4, name: 'Other Project', description: 'Another project' }
  ];

  const friends = {
    online: [
      { id: 1, name: 'Billy Blunder' },
      { id: 2, name: 'Sally Blunder' }
    ],
    offline: [
      { id: 3, name: 'NoFriends4U Smith' }
    ]
  };

  return (
    <div className="profile-page">
      <div className="profile-main">
        <Profile data={profileData} />
        <div className="profile-projects">
          <h3>John's Top Projects</h3>
          <ProjectList projects={projects} />
        </div>
      </div>
      
      <aside className="profile-sidebar">
        <div className="profile-teams">
          <h3>John's Teams</h3>
          <ul>
            {profileData.teams.map((team, index) => (
              <li key={index}>{team}</li>
            ))}
          </ul>
        </div>
        
        <FriendList friends={friends} />
      </aside>
    </div>
  );
};

export default ProfilePage;