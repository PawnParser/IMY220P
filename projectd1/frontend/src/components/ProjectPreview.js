// Author u22857941 : Christopher Yoko
import React from 'react';
import './ProjectPreview.css';

const ProjectPreview = ({ project }) => {
  return (
    <div className="project-preview">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="project-stats">
        <span>20K</span>
        <span>4K</span>
        <span>23</span>
      </div>
    </div>
  );
};

export default ProjectPreview;