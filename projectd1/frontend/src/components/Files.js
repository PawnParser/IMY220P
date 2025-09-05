// Author u22857941 : Christopher Yoko
import React from 'react';
import './Files.css';

const Files = ({ files }) => {
  return (
    <div className="files">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Path</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, index) => (
            <tr key={index}>
              <td>{file.name}</td>
              <td>{file.path}</td>
              <td>{file.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Files;