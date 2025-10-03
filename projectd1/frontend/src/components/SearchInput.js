import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import './SearchInput.css';

const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { getAuthHeaders } = useAuth();
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.search(searchTerm, searchType === 'all' ? null : searchType, token);
      
      if (response.success) {
        setResults(response.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults(null);
  };

  return (
    <div className="search-container">
      <form className="search-input" onSubmit={handleSearch}>
        <select 
          value={searchType} 
          onChange={(e) => setSearchType(e.target.value)}
          className="search-type"
        >
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="projects">Projects</option>
          <option value="checkins">Check-ins</option>
        </select>
        
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-field"
        />
        
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        
        {searchTerm && (
          <button type="button" onClick={clearSearch} className="clear-btn">
            Clear
          </button>
        )}
      </form>

      {results && (
        <div className="search-results">
          {results.users && results.users.length > 0 && (
            <div className="result-section">
              <h4>Users</h4>
              {results.users.map(user => (
                <div key={user._id} className="result-item">
                  <img src={user.avatar} alt={user.name} className="result-avatar" />
                  <div className="result-info">
                    <strong>{user.name}</strong>
                    <span>@{user.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.projects && results.projects.length > 0 && (
            <div className="result-section">
              <h4>Projects</h4>
              {results.projects.map(project => (
                <div key={project._id} className="result-item">
                  <div className="result-info">
                    <strong>{project.name}</strong>
                    <span>{project.description}</span>
                    <div className="hashtags">
                      {project.hashtags.map(tag => (
                        <span key={tag} className="hashtag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.checkins && results.checkins.length > 0 && (
            <div className="result-section">
              <h4>Check-ins</h4>
              {results.checkins.map(checkin => (
                <div key={checkin._id} className="result-item">
                  <div className="result-info">
                    <strong>{checkin.message}</strong>
                    <span>{checkin.comment}</span>
                    <small>By {checkin.userId}</small>
                  </div>
                </div>
              ))}
            </div>
          )}

          {Object.keys(results).every(key => !results[key] || results[key].length === 0) && (
            <div className="no-results">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;