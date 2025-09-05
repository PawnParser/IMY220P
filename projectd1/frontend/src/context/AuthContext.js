import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};