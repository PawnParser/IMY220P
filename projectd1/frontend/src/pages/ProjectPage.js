// Author u22857941 : Christopher Yoko
import React from 'react';
import { useParams } from 'react-router-dom';
import Project from '../components/Project';
import Files from '../components/Files';
import Messages from '../components/Messages';
import FriendList from '../components/FriendList';
import './ProjectPage.css';

const ProjectPage = () => {
  const { id } = useParams();
  
  // Dummy data
  const projectData = {
    id: id || '123',
    name: 'ScamWebsite',
    description: 'A website project for version control',
    branches: ['main', 'development', 'feature/login'],
    files: [
      { name: 'HomePage.js', path: '/src/Pages', type: 'file' },
      { name: 'LoginPage.js', path: '/src/Pages', type: 'file' },
      { name: 'ProfilePage.js', path: '/src/Pages', type: 'file' }
    ],
    messages: [
      {
        id: 1,
        user: 'Billy Blunder',
        action: 'Renamed "node_modules" to "no_demo_dules"',
        comment: 'Working code is for suckers so I decided to ruin your day for fun, enjoy this update John! I quit!!',
        time: '2 hours ago'
      },
      {
        id: 2,
        user: 'Mr John Doe',
        action: 'Fixed login validation',
        comment: 'The login form now properly validates email addresses',
        time: '5 hours ago'
      }
    ]
  };

  const friends = {
    online: [
      { id: 1, name: 'Billy Blunder' },
      { id: 2, name: 'Sally Blunder' },
      { id: 3, name: 'NoFriends4U Smith' }
    ],
    offline: [
      { id: 4, name: 'Offline Friend 1' },
      { id: 5, name: 'Offline Friend 2' }
    ]
  };

  return (
    <div className="project-page">
      <div className="project-main">
        <Project data={projectData} />
        
        <div className="project-tabs">
          <button className="active">Files</button>
          <button>Messages</button>
          <button>Branches</button>
          <button>Settings</button>
        </div>
        
        <div className="project-content">
          <Files files={projectData.files} />
          <Messages messages={projectData.messages} />
        </div>
      </div>
      
      <aside className="project-sidebar">
        <div className="project-members">
          <h3>Members</h3>
          <FriendList friends={friends} />
        </div>
      </aside>
    </div>
  );
};

export default ProjectPage;