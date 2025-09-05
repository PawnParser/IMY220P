// Author u22857941 : Christopher Yoko
import React from 'react';
import './Messages.css';

const Messages = ({ messages }) => {
  return (
    <div className="messages">
      <h3>Latest Commits</h3>
      {messages.map(message => (
        <div key={message.id} className="message">
          <h4>{message.action}</h4>
          <p>{message.comment}</p>
          <div className="message-footer">
            <span className="message-time">{message.time}</span>
            <span className="message-user">@{message.user}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Messages;