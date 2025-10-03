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
        console.log('Loaded project:', projectResponse.project);
        setProject(projectResponse.project);
      } else {
        console.error('Project not found:', projectResponse.message);
        navigate('/home');
        return;
      }

      try {
        const checkinsResponse = await apiService.getProjectCheckins(id, token);
        if (checkinsResponse.success) {
          console.log('Loaded checkins:', checkinsResponse.checkins);
          // Format checkins exactly like Feed component expects
          const formattedCheckins = checkinsResponse.checkins.map(checkin => ({
            id: checkin._id,
            user: checkin.userId || 'Unknown User', // userId is the username string
            project: projectResponse.project.name,
            message: checkin.message || 'No message',
            comment: checkin.comment || '',
            time: checkin.createdAt ? new Date(checkin.createdAt).toLocaleString() : 'Just now'
          }));
          console.log('Formatted checkins:', formattedCheckins);
          setCheckins(formattedCheckins);
        } else {
          console.error('Failed to load checkins:', checkinsResponse.message);
          setCheckins([]);
        }
      } catch (checkinError) {
        console.error('Checkins error:', checkinError);
        // Use sample data if checkins fail to load
        setCheckins([
          {
            id: 'sample-1',
            user: currentUser?.username || 'john_doe',
            project: projectResponse.project.name,
            message: 'Initial project setup',
            comment: 'Created the basic project structure and files',
            time: new Date().toLocaleString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      navigate('/home');
    } finally {
      setIsLoading(false);
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
        setActiveTab('activity'); // Switch to activity tab
        loadProjectData(); // Reload to get new checkin
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
    alert('Download functionality would be implemented here');
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
        
        {isProjectOwner && (
          <div className="project-actions">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="delete-project-btn"
            >
              Delete Project
            </button>
          </div>
        )}
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

      {/* Delete Confirmation Modal */}
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