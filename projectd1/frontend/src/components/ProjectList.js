// Author u22857941 : Christopher Yoko
import React from 'react';
import ProjectPreview from './ProjectPreview';
import './ProjectList.css';

const ProjectList = ({ projects }) => {
  return (
    <div className="project-list">
      {projects.map(project => (
        <ProjectPreview key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectList;