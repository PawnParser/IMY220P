// Author u22857941 : Christopher Yoko
import React, { useState } from 'react';
import './SearchInput.css';

const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality will be implemented in future deliverables
    console.log('Searching for:', searchTerm);
  };
  
  return (
    <form className="search-input" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchInput;