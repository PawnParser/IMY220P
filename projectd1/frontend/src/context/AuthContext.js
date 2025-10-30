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
    const token = localStorage.getItem('token');
    
    if (user && token) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
      
      // Verify token is still valid
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Token invalid');
      }
      
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    // Store user data and token in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAuthHeaders,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};