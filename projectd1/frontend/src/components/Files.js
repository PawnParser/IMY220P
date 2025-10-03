import React from 'react';
import './Files.css';

const Files = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <div className="no-files">
        <p>No files in this project yet.</p>
      </div>
    );
  }

  return (
    <div className="files">
      <div className="files-list">
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <div className="file-icon">
              {file.type === 'folder' ? '📁' : '📄'}
            </div>
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-path">{file.path}</span>
            </div>
            <div className="file-type">{file.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Files;