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
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newFile, setNewFile] = useState({ name: '', path: '/', type: 'file', content: '' });
  const [editingFile, setEditingFile] = useState(null);
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
        setEditForm({
          name: projectResponse.project.name,
          description: projectResponse.project.description,
          type: projectResponse.project.type,
          hashtags: projectResponse.project.hashtags?.join(', ') || ''
        });
        
        // Check if project is saved
        checkIfProjectIsSaved(projectResponse.project._id, token);
      } else {
        console.error('Project not found:', projectResponse.message);
        navigate('/home');
        return;
      }

      // Load check-ins
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.trim()) {
      alert('Please enter a username');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/members`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/members/${username}`, {
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

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!newOwner.trim()) {
      alert('Please select a new owner');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOwner })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewOwner('');
        setShowTransferOwnership(false);
        loadProjectData();
        alert('Ownership transferred successfully!');
      } else {
        alert('Failed to transfer ownership: ' + data.message);
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
      alert('Failed to transfer ownership: ' + error.message);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const projectData = {
        ...editForm,
        hashtags: editForm.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await apiService.updateProject(project._id, projectData, token);
      
      if (response.success) {
        setEditingProject(false);
        loadProjectData();
        alert('Project updated successfully!');
      } else {
        alert('Failed to update project: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project: ' + error.message);
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!newFile.name.trim()) {
      alert('Please enter a file name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: newFile })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewFile({ name: '', path: '/', type: 'file', content: '' });
        loadProjectData();
        alert('File added successfully!');
      } else {
        alert('Failed to add file: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding file:', error);
      alert('Failed to add file: ' + error.message);
    }
  };

  const handleUpdateFile = async (filename, content) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/files/${filename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingFile(null);
        loadProjectData();
        alert('File updated successfully!');
      } else {
        alert('Failed to update file: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating file:', error);
      alert('Failed to update file: ' + error.message);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/files/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        loadProjectData();
        alert('File deleted successfully!');
      } else {
        alert('Failed to delete file: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file: ' + error.message);
    }
  };

  const handleDownload = () => {
    if (project.files && project.files.length > 0) {
      const fileContents = project.files.map(file => 
        `${file.type === 'folder' ? '📁' : '📄'} ${file.path}/${file.name}${file.content ? `\n${file.content}` : ''}`
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

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/projects/${project._id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        loadProjectData();
        alert('Project checked out successfully!');
      } else {
        alert('Failed to checkout project: ' + data.message);
      }
    } catch (error) {
      console.error('Error checking out project:', error);
      alert('Failed to checkout project: ' + error.message);
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
        {editingProject ? (
          <form onSubmit={handleUpdateProject} className="edit-project-form">
            <div className="form-group">
              <label>Project Name:</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                required
              />
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="web">Web Application</option>
                <option value="mobile">Mobile Application</option>
                <option value="desktop">Desktop Application</option>
                <option value="library">Library/Package</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Hashtags (comma separated):</label>
              <input
                type="text"
                value={editForm.hashtags}
                onChange={(e) => setEditForm(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="react, nodejs, mongodb"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn">Save Changes</button>
              <button type="button" onClick={() => setEditingProject(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <Project data={project} />
        )}
        
        <div className="project-actions">
          <div className="project-status">
            <span className={`status-badge ${project.status}`}>
              {project.status === 'checked-in' ? '✅ Checked In' : '📝 Checked Out'}
            </span>
          </div>

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

          {isProjectMember && project.status === 'checked-in' && (
            <button onClick={handleCheckout} className="checkout-btn">
              Check Out
            </button>
          )}

          {isProjectOwner && (
            <>
              <button onClick={() => setEditingProject(!editingProject)} className="edit-project-btn">
                {editingProject ? 'Cancel Edit' : 'Edit Project'}
              </button>
              <button onClick={() => setShowAddMember(true)} className="add-member-btn">
                Add Member
              </button>
              <button onClick={() => setShowTransferOwnership(true)} className="transfer-ownership-btn">
                Transfer Ownership
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="delete-project-btn">
                Delete Project
              </button>
            </>
          )}
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
              <div className="file-actions">
                <button onClick={handleDownload} className="download-btn">
                  Download All
                </button>
                {isProjectMember && (
                  <button onClick={() => setActiveTab('add-file')} className="add-file-btn">
                    Add File
                  </button>
                )}
              </div>
            </div>
            <Files 
              files={project.files || []} 
              onEditFile={setEditingFile}
              onDeleteFile={isProjectMember ? handleDeleteFile : null}
            />
            
            {editingFile && (
              <div className="file-editor">
                <h4>Editing: {editingFile.name}</h4>
                <textarea
                  value={editingFile.content || ''}
                  onChange={(e) => setEditingFile(prev => ({ ...prev, content: e.target.value }))}
                  rows="10"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
                <div className="editor-actions">
                  <button onClick={() => handleUpdateFile(editingFile.name, editingFile.content)} className="save-btn">
                    Save Changes
                  </button>
                  <button onClick={() => setEditingFile(null)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add-file' && isProjectMember && (
          <div className="tab-content">
            <form onSubmit={handleAddFile} className="add-file-form">
              <h3>Add New File</h3>
              <div className="form-group">
                <label>File Name:</label>
                <input
                  type="text"
                  value={newFile.name}
                  onChange={(e) => setNewFile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="example.js"
                  required
                />
              </div>
              <div className="form-group">
                <label>Path:</label>
                <input
                  type="text"
                  value={newFile.path}
                  onChange={(e) => setNewFile(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="/src"
                />
              </div>
              <div className="form-group">
                <label>Type:</label>
                <select
                  value={newFile.type}
                  onChange={(e) => setNewFile(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="file">File</option>
                  <option value="folder">Folder</option>
                </select>
              </div>
              {newFile.type === 'file' && (
                <div className="form-group">
                  <label>Content:</label>
                  <textarea
                    value={newFile.content}
                    onChange={(e) => setNewFile(prev => ({ ...prev, content: e.target.value }))}
                    rows="10"
                    placeholder="File content..."
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="save-btn">Add File</button>
                <button type="button" onClick={() => setActiveTab('files')} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
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

      {showTransferOwnership && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h3>Transfer Ownership</h3>
              <button onClick={() => setShowTransferOwnership(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleTransferOwnership}>
              <div className="form-group">
                <label>New Owner:</label>
                <select
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  required
                >
                  <option value="">Select a member</option>
                  {project.members.filter(member => member !== project.owner).map((member, index) => (
                    <option key={index} value={member}>{member}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Transfer Ownership</button>
                <button type="button" onClick={() => setShowTransferOwnership(false)} className="cancel-btn">
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