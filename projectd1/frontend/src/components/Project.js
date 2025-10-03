// Author u22857941 : Christopher Yoko
import React from 'react';
import './Project.css';

const Project = ({ data }) => {
  return (
    <div className="project">
      <div className="project-header">
        <div className="project-title-section">
          <h1 className="project-name">{data.name}</h1>
          <span className="project-type">{data.type}</span>
        </div>
        <p className="project-description">{data.description}</p>
        <div className="project-meta">
          <span className="project-owner">By {data.owner}</span>
          <span className="project-branch">Branch: {data.branches?.[0] || 'main'}</span>
        </div>
        {data.hashtags && data.hashtags.length > 0 && (
          <div className="project-tags">
            {data.hashtags.map((tag, index) => (
              <span key={index} className="project-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Project;