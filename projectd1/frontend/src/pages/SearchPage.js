import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import dpImage from '../assets/images/dp.jpg';
import './SearchPage.css';

const SearchPage = () => {
  const [results, setResults] = useState({ users: [], projects: [], checkins: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { getAuthHeaders } = useAuth();
  const location = useLocation();
  
  const query = new URLSearchParams(location.search).get('q');

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiService.search(searchQuery, null, token);
      
      if (response.success) {
        setResults(response.results);
      } else {
        setResults({ users: [], projects: [], checkins: [] });
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({ users: [], projects: [], checkins: [] });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Searching...</div>;
  }

  const totalResults = (results.users?.length || 0) + (results.projects?.length || 0) + (results.checkins?.length || 0);

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results</h1>
        <p className="search-query">for "{query}"</p>
        <p className="results-count">{totalResults} results found</p>
      </div>

      <div className="search-results">
        {results.users && results.users.length > 0 && (
          <div className="results-section">
            <h2>Users ({results.users.length})</h2>
            <div className="users-grid">
              {results.users.map(user => (
                <Link key={user._id} to={`/profile/${user.username}`} className="user-card">
                  <img 
                    src={user.avatar || dpImage} 
                    alt={user.name} 
                    className="user-avatar" 
                    onError={(e) => {
                      e.target.src = dpImage;
                    }}
                  />
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>@{user.username}</p>
                    {user.bio && <p className="user-bio">{user.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {results.projects && results.projects.length > 0 && (
          <div className="results-section">
            <h2>Projects ({results.projects.length})</h2>
            <div className="projects-grid">
              {results.projects.map(project => (
                <Link key={project._id} to={`/project/${project.name}`} className="project-card">
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <div className="project-meta">
                      <span>By {project.owner}</span>
                      <span>Type: {project.type}</span>
                    </div>
                    <div className="hashtags">
                      {project.hashtags.map(tag => (
                        <span key={tag} className="hashtag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {results.checkins && results.checkins.length > 0 && (
          <div className="results-section">
            <h2>Check-ins ({results.checkins.length})</h2>
            <div className="checkins-list">
              {results.checkins.map(checkin => (
                <div key={checkin._id} className="checkin-card">
                  <div className="checkin-header">
                    <span className="user">@{checkin.userId}</span>
                    <span className="time">{new Date(checkin.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="checkin-message">{checkin.message}</p>
                  {checkin.comment && <p className="checkin-comment">{checkin.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {totalResults === 0 && (
          <div className="no-results">
            <h2>No results found</h2>
            <p>Try different search terms or check your spelling.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;