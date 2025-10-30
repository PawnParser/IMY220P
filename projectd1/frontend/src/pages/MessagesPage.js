import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import './MessagesPage.css';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadConversations();
    loadFriends();
  }, []);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getConversations(token);
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getUserFriends(currentUser.username, token);
      if (response.success) {
        setFriends(response.friends);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadMessages = async (friendUsername) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getMessages(friendUsername, token);
      if (response.success) {
        setMessages(response.messages);
        setActiveConversation(friendUsername);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await apiService.sendMessage(activeConversation, newMessage, token);
      if (response.success) {
        setNewMessage('');
        loadMessages(activeConversation);
        loadConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const startNewConversation = async (friendUsername) => {
    setActiveConversation(friendUsername);
    setMessages([]);
    loadMessages(friendUsername);
  };

  if (isLoading) {
    return <div className="loading">Loading messages...</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h1>Messages</h1>
      </div>

      <div className="messages-container">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h3>Conversations</h3>
          </div>
          
          <div className="friends-list">
            <h4>Friends</h4>
            {friends.map(friend => (
              <div 
                key={friend.username}
                className={`friend-item ${activeConversation === friend.username ? 'active' : ''}`}
                onClick={() => startNewConversation(friend.username)}
              >
                <img src={friend.avatar || '/assets/images/dp.jpg'} alt={friend.name} className="friend-avatar" />
                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-username">@{friend.username}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="conversations-list">
            <h4>Recent Conversations</h4>
            {conversations.map(convo => (
              <div 
                key={convo.friendUsername}
                className={`conversation-item ${activeConversation === convo.friendUsername ? 'active' : ''}`}
                onClick={() => loadMessages(convo.friendUsername)}
              >
                <img src={convo.friendAvatar || '/assets/images/dp.jpg'} alt={convo.friendName} className="conversation-avatar" />
                <div className="conversation-info">
                  <span className="conversation-name">{convo.friendName}</span>
                  <span className="conversation-preview">{convo.lastMessage}</span>
                </div>
                <span className="conversation-time">
                  {convo.lastMessageTime ? new Date(convo.lastMessageTime).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-area">
          {activeConversation ? (
            <>
              <div className="messages-header">
                <h3>Chat with {activeConversation}</h3>
              </div>
              
              <div className="messages-list">
                {messages.map(message => (
                  <div 
                    key={message._id} 
                    className={`message ${message.sender === currentUser.username ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="message-input-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-button">Send</button>
              </form>
            </>
          ) : (
            <div className="no-conversation">
              <p>Select a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;