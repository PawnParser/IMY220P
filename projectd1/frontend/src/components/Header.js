// Author u22857941 : Christopher Yoko
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import dpImage from '../assets/images/dp.jpg';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchInput(false);
    }
  };

  const handleSearchClick = () => {
    setShowSearchInput(!showSearchInput);
    if (!showSearchInput) {
      // Focus on input when it becomes visible
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input-field');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSearchInput(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/home">CodeLink</Link>
      </div>

      <nav className="nav">
        <Link to="/home">Home</Link>
        <Link to={`/profile/${currentUser?.username}`}>Profile</Link>
      </nav>

      <div className="header-actions">
        {/* Search functionality */}
        <div className="search-container">
          {showSearchInput && (
            <form className="search-input-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search users, projects, check-ins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-input-field"
                autoFocus
              />
              <button type="submit" className="btn btn-icon search-submit-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <button 
                type="button" 
                className="btn btn-icon search-close-btn"
                onClick={() => {
                  setShowSearchInput(false);
                  setSearchQuery('');
                }}
              >
                ×
              </button>
            </form>
          )}
          
          <button 
            className={`btn btn-icon ${showSearchInput ? 'active' : ''}`} 
            onClick={handleSearchClick}
            title="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <button className="btn btn-icon" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>

        <button className="btn btn-icon" onClick={toggleTheme} title="Toggle theme">
          {isDarkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>

        <div className="user-menu">
          <img 
            src={currentUser?.avatar || dpImage} 
            alt={currentUser?.username} 
            className="avatar" 
            onError={(e) => {
              // Fallback if the user's avatar fails to load
              e.target.src = dpImage;
            }}
          />
          <span className="username">{currentUser?.username}</span>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;