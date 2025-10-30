import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import Project from '../components/Project';
import Files from '../components/Files';
import Feed from '../components/Feed';
import './ProjectPage.css';

const ProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files');
  const [newCheckin, setNewCheckin] = useState({ message: '', comment: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const projectResponse = await apiService.getProject(id, token);
      if (projectResponse.success) {
        setProject(projectResponse.project);
        
        // Check if project is saved by current user
        checkIfProjectIsSaved(projectResponse.project._id, token);
      } else {
        console.error('Project not found:', projectResponse.message);
        navigate('/home');
        return;
      }

      try {
        const checkinsResponse = await apiService.getProjectCheckins(id, token);
        if (checkinsResponse.success) {
          const formattedCheckins = checkinsResponse.checkins.map(checkin => ({
            id: checkin._id,
            user: checkin.userId || 'Unknown User',
            project: projectResponse.project.name,
            message: checkin.message || 'No message',
            comment: checkin.comment || '',
            time: checkin.createdAt ? new Date(checkin.createdAt).toLocaleString() : 'Just now'
          }));
          setCheckins(formattedCheckins);
        } else {
          setCheckins([]);
        }
      } catch (checkinError) {
        console.error('Checkins error:', checkinError);
        setCheckins([]);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      navigate('/home');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfProjectIsSaved = async (projectId, token) => {
    try {
      // Get current user's profile to check saved projects
      const userResponse = await apiService.getProfile(token);
      if (userResponse.success) {
        const user = userResponse.user;
        // Check if project is in user's saved projects
        // This assumes we add a 'savedProjects' field to the user model
        const saved = user.savedProjects && user.savedProjects.includes(projectId);
        setIsSaved(saved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveProject = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Create a simple API call to save the project
      // This would need to be implemented in your backend
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSaved(true);
        alert('Project saved to your saved projects!');
      } else {
        alert('Failed to save project: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project: ' + error.message);
    }
  };

  const handleUnsaveProject = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/unsave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSaved(false);
        alert('Project removed from saved projects!');
      } else {
        alert('Failed to unsave project: ' + data.message);
      }
    } catch (error) {
      console.error('Error unsaving project:', error);
      alert('Failed to unsave project: ' + error.message);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!newCheckin.message.trim()) {
      alert('Please enter a message for your check-in');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await apiService.createCheckin(project._id, newCheckin, token);
      
      if (response.success) {
        setNewCheckin({ message: '', comment: '' });
        setActiveTab('activity');
        loadProjectData();
        alert('Check-in created successfully!');
      } else {
        alert('Failed to create check-in: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating checkin:', error);
      alert('Failed to create check-in: ' + error.message);
    }
  };

  const handleDownload = () => {
    // Create a simple file download
    if (project.files && project.files.length > 0) {
      const fileContents = project.files.map(file => 
        `${file.type === 'folder' ? '📁' : '📄'} ${file.path}/${file.name}`
      ).join('\n');
      
      const blob = new Blob([fileContents], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}_files.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('No files to download');
    }
  };

  const handleDeleteProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.deleteProject(project._id, token);
      
      if (response.success) {
        alert('Project deleted successfully');
        navigate('/home');
      } else {
        alert('Failed to delete project: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: ' + error.message);
    }
  };

  const isProjectOwner = project && currentUser && project.owner === currentUser.username;

  if (isLoading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  return (
    <div className="project-page">
      <div className="project-header-section">
        <Project data={project} />
        
        <div className="project-actions">
          {!isProjectOwner && (
            <div className="save-project-actions">
              {isSaved ? (
                <button 
                  onClick={handleUnsaveProject}
                  className="unsave-project-btn"
                >
                  Unsave Project
                </button>
              ) : (
                <button 
                  onClick={handleSaveProject}
                  className="save-project-btn"
                >
                  Save Project
                </button>
              )}
            </div>
          )}
          
          {isProjectOwner && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="delete-project-btn"
            >
              Delete Project
            </button>
          )}
        </div>
      </div>
      
      <div className="project-tabs">
        <button 
          className={activeTab === 'files' ? 'active' : ''}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button 
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          Activity ({checkins.length})
        </button>
        <button 
          className={activeTab === 'checkin' ? 'active' : ''}
          onClick={() => setActiveTab('checkin')}
        >
          Check In
        </button>
      </div>

      <div className="project-content">
        {activeTab === 'files' && (
          <div className="tab-content">
            <div className="files-header">
              <h3>Project Files</h3>
              <button onClick={handleDownload} className="download-btn">
                Download All
              </button>
            </div>
            <Files files={project.files || []} />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="tab-content">
            <div className="activity-header">
              <h3>Recent Check-ins</h3>
              <p className="activity-subtitle">Latest updates and changes to this project</p>
            </div>
            {checkins.length > 0 ? (
              <Feed items={checkins} />
            ) : (
              <div className="no-data">
                <p>No check-in activity yet.</p>
                <p>Be the first to check in changes to this project!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkin' && (
          <div className="tab-content">
            <form onSubmit={handleCheckinSubmit} className="checkin-form">
              <h3>Check In Changes</h3>
              <div className="form-group">
                <label>Message:</label>
                <input
                  type="text"
                  value={newCheckin.message}
                  onChange={(e) => setNewCheckin(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Brief description of changes"
                  required
                />
              </div>
              <div className="form-group">
                <label>Detailed Comment:</label>
                <textarea
                  value={newCheckin.comment}
                  onChange={(e) => setNewCheckin(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Detailed description of changes made"
                  rows="4"
                />
              </div>
              <button type="submit" className="submit-btn">Check In</button>
            </form>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h3>Delete Project</h3>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the project "<strong>{project.name}</strong>"?</p>
              <p>This action cannot be undone and all project data will be lost.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleDeleteProject}
                className="confirm-delete-btn"
              >
                Yes, Delete Project
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;