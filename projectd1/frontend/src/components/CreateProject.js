import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import './Form.css';

const CreateProject = ({ onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'web',
    hashtags: '',
    image: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
    
    try {
      const token = localStorage.getItem('token');
      const projectData = {
        ...formData,
        hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      const result = await apiService.createProject(projectData, token);
      
      if (result.success) {
        setFormData({
          name: '',
          description: '',
          type: 'web',
          hashtags: '',
          image: ''
        });
        
        if (onProjectCreated) {
          onProjectCreated(result.project);
        }
      } else {
        setErrors({ submit: result.message || 'Failed to create project' });
      }
    } catch (error) {
      console.error('Create project error:', error);
      setErrors({ submit: 'Failed to create project' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h3>Create New Project</h3>
      
      <div className="form-group">
        <label htmlFor="project-name">Project Name</label>
        <input
          type="text"
          id="project-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="Enter project name"
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={errors.description ? 'error' : ''}
          placeholder="Describe your project"
          rows="3"
        />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="project-type">Project Type</label>
        <select
          id="project-type"
          name="type"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="web">Web Application</option>
          <option value="mobile">Mobile Application</option>
          <option value="desktop">Desktop Application</option>
          <option value="library">Library/Package</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="project-hashtags">Hashtags (comma separated)</label>
        <input
          type="text"
          id="project-hashtags"
          name="hashtags"
          value={formData.hashtags}
          onChange={handleChange}
          placeholder="react, nodejs, mongodb"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="project-image">Project Image URL</label>
        <input
          type="text"
          id="project-image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      
      {errors.submit && <div className="error-text submit-error">{errors.submit}</div>}
      
      <button 
        type="submit" 
        className="submit-btn"
        disabled={isLoading}
      >
        {isLoading ? 'CREATING...' : 'CREATE PROJECT'}
      </button>
    </form>
  );
};

export default CreateProject;