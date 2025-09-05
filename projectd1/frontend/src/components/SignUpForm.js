// Author u22857941 : Christopher Yoko
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Form.css';

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsLoading(true);
    
    // Stubbed API call as per requirements
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store user data and update auth state
        login(data.user);
        
        // Navigate to home page
        navigate('/home');
      } else {
        alert('Sign up failed: ' + (data.message || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      alert('Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="signup-username">Username</label>
        <input
          type="text"
          id="signup-username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={errors.username ? 'error' : ''}
          placeholder="Choose a username"
        />
        {errors.username && <span className="error-text">{errors.username}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="signup-password">Password</label>
        <input
          type="password"
          id="signup-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? 'error' : ''}
          placeholder="Create a password"
        />
        {errors.password && <span className="error-text">{errors.password}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="confirm-password">Confirm Password</label>
        <input
          type="password"
          id="confirm-password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={errors.confirmPassword ? 'error' : ''}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
      </div>
      
      <button 
        type="submit" 
        className="submit-btn"
        disabled={isLoading}
      >
        {isLoading ? 'SIGNING UP...' : 'SIGN UP'}
      </button>
    </form>
  );
};

export default SignUpForm;