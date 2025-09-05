// Author u22857941 : Christopher Yoko
import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import './SplashPage.css';

const SplashPage = ({ isLogin = false }) => {
  const [isLoginForm, setIsLoginForm] = useState(isLogin);
  const [showAuth, setShowAuth] = useState(false);

  const handleGetStarted = () => {
    setShowAuth(true);
    setIsLoginForm(false);
  };

  const handleSignIn = () => {
    setShowAuth(true);
    setIsLoginForm(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowAuth(false);
    }
  };

  return (
    <div className="splash-page">
      {/* Left Side - Text Content */}
      <div className="splash-left">
        <div className="logo-container">
          <div className="code-symbol">&lt;/&gt;</div>
          <div className="brand-name">CodeLink</div>
        </div>
        
        <div className="hero-content">
          <h1 className="main-title">
            Collaborate.<br />
            Commit.<br />
            Create.
          </h1>
          <p className="subtitle">Version control made simple for teams and individuals.</p>
          <button className="cta-button" onClick={handleGetStarted}>
            Sign Up Now!
          </button>
        </div>
      </div>

      {/* Right Side - 3D Globe */}
      <div className="splash-right">
        <div className="globe-container">
          <div className="globe">
            {/* Multiple layers for 3D effect */}
            <div className="globe-layer"></div>
            <div className="globe-layer"></div>
            <div className="globe-layer"></div>
            <div className="globe-layer"></div>
            <div className="globe-layer"></div>
            <div className="globe-layer"></div>
            
            {/* Longitude lines */}
            <div className="longitude-lines">
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
              <div className="longitude-line"></div>
            </div>
            
            {/* Latitude lines */}
            <div className="latitude-lines">
              <div className="latitude-line"></div>
              <div className="latitude-line"></div>
              <div className="latitude-line"></div>
              <div className="latitude-line"></div>
              <div className="latitude-line"></div>
              <div className="latitude-line"></div>
              <div className="latitude-line"></div>
              <div className="latitude-line"></div>
            </div>
            
            {/* Connection points */}
            <div className="globe-connections">
              <div className="connection-point"></div>
              <div className="connection-point"></div>
              <div className="connection-point"></div>
              <div className="connection-point"></div>
              <div className="connection-point"></div>
              <div className="connection-point"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="auth-overlay" onClick={handleOverlayClick}>
          <div className="auth-modal">
            <button className="close-button" onClick={handleCloseAuth}>
              ×
            </button>
            
            {isLoginForm ? (
              <>
                <h2>Welcome Back!</h2>
                <LoginForm />
                <p className="auth-switch">
                  Not a member? <span onClick={() => setIsLoginForm(false)}>Sign Up</span>
                </p>
              </>
            ) : (
              <>
                <h2>Sign Up Now!</h2>
                <SignUpForm />
                <p className="auth-switch">
                  Already a member? <span onClick={() => setIsLoginForm(true)}>Sign In</span>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashPage;