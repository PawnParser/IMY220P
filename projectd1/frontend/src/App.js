// Author u22857941 : Christopher Yoko
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SplashPage from './pages/SplashPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProjectPage from './pages/ProjectPage';
import SearchPage from './pages/SearchPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  return isAuthenticated && currentUser?.role === 'admin' ? children : <Navigate to="/home" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<SplashPage />} />
              <Route path="/login" element={<SplashPage isLogin={true} />} />
              <Route path="/signup" element={<SplashPage isLogin={false} />} />
              <Route path="/*" element={<MainLayout />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function MainLayout() {
  const { isAuthenticated, currentUser } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return (
    <>
      <Header />
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile/:id?" element={<ProfilePage />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </>
  );
}

export default App;