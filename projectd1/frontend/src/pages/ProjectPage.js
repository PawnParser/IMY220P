import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import Project from '../components/Project';
import Files from '../components/Files';
import Messages from '../components/Messages';
import './ProjectPage.css';

const ProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files');
  const [newCheckin, setNewCheckin] = useState({ message: '', comment: '' });
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
          setCheckins(checkinsResponse.checkins.map(checkin => ({
            id: checkin._id,
            action: checkin.message,
            comment: checkin.comment,
            time: new Date(checkin.createdAt).toLocaleString(),
            user: checkin.userId
          })));
        }
      } catch (checkinError) {
        console.log('Checkins not available:', checkinError);
        setCheckins([]);
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
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.createCheckin(project._id, newCheckin, token);
      
      if (response.success) {
        setNewCheckin({ message: '', comment: '' });
        loadProjectData(); // Reload to get new checkin
      }
    } catch (error) {
      console.error('Error creating checkin:', error);
    }
  };

  const handleDownload = () => {
    alert('Download functionality would be implemented here');
  };

  if (isLoading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  return (
    <div className="project-page">
      <Project data={project} />
      
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
          Activity
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
          <div>
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
          <div>
            <h3>Project Activity</h3>
            {checkins.length > 0 ? (
              <Messages messages={checkins} />
            ) : (
              <div className="no-data">
                <p>No check-in activity yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkin' && (
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
        )}
      </div>
    </div>
  );
};

export default ProjectPage;