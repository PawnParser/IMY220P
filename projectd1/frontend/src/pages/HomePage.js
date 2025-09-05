// Author u22857941 : Christopher Yoko
import React from 'react';
import Feed from '../components/Feed';
import ProjectList from '../components/ProjectList';
import FriendList from '../components/FriendList';
import SearchInput from '../components/SearchInput';
import './HomePage.css';

const HomePage = () => {
  // Dummy data as per requirements
  const projects = [
    { id: 1, name: 'ScamWebsite', description: 'A website project' },
    { id: 2, name: 'GenerousPortfolio', description: 'Portfolio generator' },
    { id: 3, name: 'Shoe lace tying AI', description: 'AI to tie shoelaces' },
    { id: 4, name: 'Other Project', description: 'Another project' }
  ];

  const friends = {
    online: [
      { id: 1, name: 'Billy Blunder', projects: 12 },
      { id: 2, name: 'Sally Blunder', projects: 8 },
      { id: 3, name: 'NoFriends4U Smith', projects: 3 }
    ],
    offline: [
      { id: 4, name: 'Offline Friend 1', projects: 5 },
      { id: 5, name: 'Offline Friend 2', projects: 7 }
    ]
  };

  const feedItems = [
    {
      id: 1,
      user: 'Mr John Doe',
      project: 'Stay in Sync',
      message: 'Renamed "node_modules" to "no_demo_dules"',
      comment: 'Working code is for suckers so I decided to ruin your day for fun, enjoy this update John! I quit!!',
      time: '2 hours ago'
    },
    {
      id: 2,
      user: 'Billy Blunder',
      project: 'ChessWebsite',
      message: 'Fixed pawn movement logic',
      comment: 'Pawns can now move forward properly without crashing the game',
      time: '4 hours ago'
    }
  ];

  return (
    <div className="home-page">
      <div className="main-content">
        <div className="feed-section">
          <div className="feed-header">
            <h2>My Network</h2>
            <div className="feed-tabs">
              <button className="active">Global feed</button>
              <button>Recent commits</button>
              <button>Code Projects</button>
            </div>
            <select className="sort-select">
              <option>Sort By (Date)</option>
              <option>Sort By (Views)</option>
            </select>
          </div>
          <Feed items={feedItems} />
        </div>

        <div className="projects-section">
          <h2>Your Projects</h2>
          <SearchInput />
          <ProjectList projects={projects} />
        </div>
      </div>

      <aside className="sidebar">
        <FriendList friends={friends} />
      </aside>
    </div>
  );
};

export default HomePage;