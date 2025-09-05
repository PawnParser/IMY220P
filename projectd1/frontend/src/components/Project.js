// Author u22857941 : Christopher Yoko
import React from 'react';
import './Project.css';

const Project = ({ data }) => {
  return (
    <div className="project">
      <div className="project-header">
        <h1>{data.name}</h1>
        <div className="project-actions">
          <button>Branch: {data.branches[0]}</button>
          <button>Edit</button>
          <button>Download</button>
          <button>Search</button>
        </div>
      </div>
      <p className="project-description">{data.description}</p>
    </div>
  );
};

export default Project;