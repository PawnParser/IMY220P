import React from 'react';
import { Link } from 'react-router-dom';
import ProjectPreview from './ProjectPreview';
import './ProjectList.css';

const ProjectList = ({ projects }) => {
  return (
    <div className="project-list">
      {projects.map(project => (
        <Link 
          key={project._id || project.id} 
          to={`/project/${project.name}`}
          className="project-link"
        >
          <ProjectPreview project={project} />
        </Link>
      ))}
    </div>
  );
};

export default ProjectList;