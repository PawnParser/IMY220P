// Author u22857941 : Christopher Yoko
import React from 'react';
import './ProjectPreview.css';

const ProjectPreview = ({ project }) => {
  return (
    <div className="project-preview">
      <div className="project-preview-header">
        <h3>{project.name}</h3>
        <span className="project-type">{project.type}</span>
      </div>
      <p className="project-description">{project.description}</p>
      <div className="project-meta">
        <span className="project-owner">By {project.owner}</span>
        {project.hashtags && project.hashtags.length > 0 && (
          <div className="project-tags">
            {project.hashtags.slice(0, 3).map((tag, index) => (
              <span key={index} className="project-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPreview;