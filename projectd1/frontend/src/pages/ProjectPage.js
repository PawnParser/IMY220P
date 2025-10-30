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
  const [activeTab, setActiveTab] = useState('overview');
  const [newCheckin, setNewCheckin] = useState({ message: '', comment: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const { currentUser } = useAuth();

  const API_BASE = 'http://localhost:5000';

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
        
        // Check if project is saved
        checkIfProjectIsSaved(projectResponse.project._id, token);
        
        // Load check-ins using project ID
        try {
          const checkinsResponse = await apiService.getProjectCheckins(projectResponse.project._id, token);
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
      } else {
        console.error('Project not found:', projectResponse.message);
        navigate('/home');
        return;
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
      const userResponse = await apiService.getProfile(token);
      if (userResponse.success) {
        const user = userResponse.user;
        const saved = user.savedProjects && user.savedProjects.some(savedId => 
          savedId.toString() === projectId.toString()
        );
        setIsSaved(saved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/projects/${project._id}/save`, {
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
      const response = await fetch(`${API_BASE}/api/projects/${project._id}/unsave`, {
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.trim()) {
      alert('Please enter a username');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/projects/${project._id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newMember })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewMember('');
        setShowAddMember(false);
        loadProjectData();
        alert('Member added successfully!');
      } else {
        alert('Failed to add member: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member: ' + error.message);
    }
  };

  const handleRemoveMember = async (username) => {
    if (!confirm(`Are you sure you want to remove ${username} from the project?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/projects/${project._id}/members/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        loadProjectData();
        alert('Member removed successfully!');
      } else {
        alert('Failed to remove member: ' + data.message);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member: ' + error.message);
    }
  };

  const handleDownload = async () => {
    if (project.files && project.files.length > 0) {
      try {
        // Try to use JSZip for creating a zip file
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Add files to zip
        project.files.forEach(file => {
          if (file.type === 'file' && file.content) {
            const filePath = file.path ? `${file.path}/${file.name}` : file.name;
            zip.file(filePath, file.content);
          }
        });
        
        // Generate and download zip
        const content = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_files.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating zip:', error);
        // Fallback to text file if JSZip fails
        const fileContents = project.files.map(file => 
          `${file.type === 'folder' ? '📁' : '📄'} ${file.path}/${file.name}\n${file.content || 'No content available'}\n`
        ).join('\n\n');
        
        const blob = new Blob([fileContents], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_files.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
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
  const isProjectMember = project && currentUser && (project.owner === currentUser.username || project.members.includes(currentUser.username));

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
          <div className="project-status">
            <span className={`status-badge ${project.status}`}>
              {project.status === 'checked-in' ? '✅ Checked In' : '📝 Checked Out'}
            </span>
          </div>

          <div className="action-buttons">
            {!isProjectOwner && !isSaved && (
              <button onClick={handleSaveProject} className="save-project-btn">
                Save Project
              </button>
            )}

            {!isProjectOwner && isSaved && (
              <button onClick={handleUnsaveProject} className="unsave-project-btn">
                Unsave Project
              </button>
            )}

            {isProjectOwner && (
              <>
                <button onClick={() => setShowAddMember(true)} className="add-member-btn">
                  Add Member
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="delete-project-btn">
                  Delete Project
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="project-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}>
          Files ({project.files?.length || 0})
        </button>
        <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>
          Activity ({checkins.length})
        </button>
        {isProjectMember && (
          <button className={activeTab === 'checkin' ? 'active' : ''} onClick={() => setActiveTab('checkin')}>
            Check In
          </button>
        )}
        {isProjectOwner && (
          <button className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}>
            Members ({project.members?.length || 0})
          </button>
        )}
      </div>

      <div className="project-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="project-info">
              <h3>Project Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Owner:</strong>
                  <span>{project.owner}</span>
                </div>
                <div className="info-item">
                  <strong>Type:</strong>
                  <span>{project.type}</span>
                </div>
                <div className="info-item">
                  <strong>Status:</strong>
                  <span className={`status ${project.status}`}>
                    {project.status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                  </span>
                </div>
                <div className="info-item">
                  <strong>Created:</strong>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <strong>Last Updated:</strong>
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {project.hashtags && project.hashtags.length > 0 && (
                <div className="hashtags-section">
                  <h4>Technologies & Tags</h4>
                  <div className="hashtags">
                    {project.hashtags.map((tag, index) => (
                      <span key={index} className="hashtag">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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

        {activeTab === 'checkin' && isProjectMember && (
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

        {activeTab === 'members' && isProjectOwner && (
          <div className="tab-content">
            <div className="members-header">
              <h3>Project Members</h3>
              <button onClick={() => setShowAddMember(true)} className="add-member-btn">
                Add Member
              </button>
            </div>
            <div className="members-list">
              <div className="member-item owner">
                <span className="member-name">{project.owner} (Owner)</span>
              </div>
              {project.members.filter(member => member !== project.owner).map((member, index) => (
                <div key={index} className="member-item">
                  <span className="member-name">{member}</span>
                  <button 
                    onClick={() => handleRemoveMember(member)}
                    className="remove-member-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {project.members.filter(member => member !== project.owner).length === 0 && (
                <div className="no-data">
                  <p>No additional members yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddMember && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h3>Add Member</h3>
              <button onClick={() => setShowAddMember(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Add Member</button>
                <button type="button" onClick={() => setShowAddMember(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h3>Delete Project</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the project "<strong>{project.name}</strong>"?</p>
              <p>This action cannot be undone and all project data will be lost.</p>
            </div>
            <div className="modal-actions">
              <button onClick={handleDeleteProject} className="confirm-delete-btn">
                Yes, Delete Project
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="cancel-btn">
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