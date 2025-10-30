import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import './AdminPage.css';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const { currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (activeTab === 'users') {
        const response = await apiService.getAdminUsers(token);
        if (response.success) {
          setUsers(response.users);
        }
      } else if (activeTab === 'projects') {
        const response = await apiService.getAdminProjects(token);
        if (response.success) {
          setProjects(response.projects);
        }
      } else if (activeTab === 'checkins') {
        const response = await apiService.getAdminCheckins(token);
        if (response.success) {
          setCheckins(response.checkins);
        }
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setEditForm({ ...item });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingItem.type === 'user') {
        const response = await apiService.updateAdminUser(editingItem.username, editForm, token);
        if (response.success) {
          alert('User updated successfully');
          setEditingItem(null);
          loadData();
        }
      } else if (editingItem.type === 'project') {
        const response = await apiService.updateAdminProject(editingItem._id, editForm, token);
        if (response.success) {
          alert('Project updated successfully');
          setEditingItem(null);
          loadData();
        }
      } else if (editingItem.type === 'checkin') {
        const response = await apiService.updateAdminCheckin(editingItem._id, editForm, token);
        if (response.success) {
          alert('Check-in updated successfully');
          setEditingItem(null);
          loadData();
        }
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update: ' + error.message);
    }
  };

  const handleDelete = async (item, type) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const token = localStorage.getItem('token');
      
      if (type === 'user') {
        const response = await apiService.deleteAdminUser(item.username, token);
        if (response.success) {
          alert('User deleted successfully');
          loadData();
        }
      } else if (type === 'project') {
        const response = await apiService.deleteAdminProject(item._id, token);
        if (response.success) {
          alert('Project deleted successfully');
          loadData();
        }
      } else if (type === 'checkin') {
        const response = await apiService.deleteAdminCheckin(item._id, token);
        if (response.success) {
          alert('Check-in deleted successfully');
          loadData();
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete: ' + error.message);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading admin data...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {currentUser?.name}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button 
          className={activeTab === 'projects' ? 'active' : ''} 
          onClick={() => setActiveTab('projects')}
        >
          Projects ({projects.length})
        </button>
        <button 
          className={activeTab === 'checkins' ? 'active' : ''} 
          onClick={() => setActiveTab('checkins')}
        >
          Check-ins ({checkins.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>User Management</h2>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Friends</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        {editingItem && editingItem._id === user._id ? (
                          <select
                            value={editForm.role || 'user'}
                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td>{user.friends?.length || 0}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="actions">
                        {editingItem && editingItem._id === user._id ? (
                          <>
                            <button onClick={handleSave} className="save-btn">Save</button>
                            <button onClick={() => setEditingItem(null)} className="cancel-btn">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(user, 'user')} className="edit-btn">Edit</button>
                            {user.username !== currentUser.username && (
                              <button onClick={() => handleDelete(user, 'user')} className="delete-btn">Delete</button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="admin-section">
            <h2>Project Management</h2>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => (
                    <tr key={project._id}>
                      <td>
                        {editingItem && editingItem._id === project._id ? (
                          <input
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          />
                        ) : (
                          project.name
                        )}
                      </td>
                      <td>
                        {editingItem && editingItem._id === project._id ? (
                          <input
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          />
                        ) : (
                          project.description
                        )}
                      </td>
                      <td>{project.owner}</td>
                      <td>
                        {editingItem && editingItem._id === project._id ? (
                          <select
                            value={editForm.type || 'web'}
                            onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                          >
                            <option value="web">Web</option>
                            <option value="mobile">Mobile</option>
                            <option value="desktop">Desktop</option>
                            <option value="library">Library</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          project.type
                        )}
                      </td>
                      <td>{project.members?.length || 0}</td>
                      <td>
                        <span className={`status-badge ${project.status}`}>
                          {project.status}
                        </span>
                      </td>
                      <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                      <td className="actions">
                        {editingItem && editingItem._id === project._id ? (
                          <>
                            <button onClick={handleSave} className="save-btn">Save</button>
                            <button onClick={() => setEditingItem(null)} className="cancel-btn">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(project, 'project')} className="edit-btn">Edit</button>
                            <button onClick={() => handleDelete(project, 'project')} className="delete-btn">Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div className="admin-section">
            <h2>Check-in Management</h2>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Project</th>
                    <th>Message</th>
                    <th>Comment</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map(checkin => (
                    <tr key={checkin._id}>
                      <td>{checkin.userId}</td>
                      <td>{checkin.project?.[0]?.name || 'Unknown Project'}</td>
                      <td>
                        {editingItem && editingItem._id === checkin._id ? (
                          <input
                            value={editForm.message || ''}
                            onChange={(e) => setEditForm({...editForm, message: e.target.value})}
                          />
                        ) : (
                          checkin.message
                        )}
                      </td>
                      <td>
                        {editingItem && editingItem._id === checkin._id ? (
                          <input
                            value={editForm.comment || ''}
                            onChange={(e) => setEditForm({...editForm, comment: e.target.value})}
                          />
                        ) : (
                          checkin.comment
                        )}
                      </td>
                      <td>{new Date(checkin.createdAt).toLocaleDateString()}</td>
                      <td className="actions">
                        {editingItem && editingItem._id === checkin._id ? (
                          <>
                            <button onClick={handleSave} className="save-btn">Save</button>
                            <button onClick={() => setEditingItem(null)} className="cancel-btn">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(checkin, 'checkin')} className="edit-btn">Edit</button>
                            <button onClick={() => handleDelete(checkin, 'checkin')} className="delete-btn">Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;