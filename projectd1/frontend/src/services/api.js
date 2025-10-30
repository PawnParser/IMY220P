// API service functions
const API_BASE = 'http://localhost:5000';

export const apiService = {
  // Authentication
  async login(credentials) {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return await response.json();
  },

  async signup(userData) {
    const response = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return await response.json();
  },

  // Users
  async getProfile(token) {
    const response = await fetch(`${API_BASE}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async updateProfile(profileData, token, isFormData = false) {
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}/api/users/profile`, {
      method: 'PUT',
      headers: headers,
      body: isFormData ? profileData : JSON.stringify(profileData)
    });
    return await response.json();
  },

  async getUser(username, token) {
    const response = await fetch(`${API_BASE}/api/users/${username}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async getUserFriends(username, token) {
    const response = await fetch(`${API_BASE}/api/users/${username}/friends`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  // Friends
  async sendFriendRequest(username, token) {
    try {
      const response = await fetch(`${API_BASE}/api/friends/request/${username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send friend request');
      }
      
      return data;
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    }
  },

  async acceptFriendRequest(username, token) {
    try {
      const response = await fetch(`${API_BASE}/api/friends/accept/${username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept friend request');
      }
      
      return data;
    } catch (error) {
      console.error('Accept friend request error:', error);
      throw error;
    }
  },

  async removeFriend(username, token) {
    try {
      const response = await fetch(`${API_BASE}/api/friends/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove friend');
      }
      
      return data;
    } catch (error) {
      console.error('Remove friend error:', error);
      throw error;
    }
  },

  async getFriendRequests(token) {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get friend requests');
      }
      
      return data;
    } catch (error) {
      console.error('Get friend requests error:', error);
      throw error;
    }
  },

  // Projects
  async getProjects(token) {
    const response = await fetch(`${API_BASE}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async getProject(projectId, token) {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async createProject(projectData, token) {
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
    return await response.json();
  },

  async updateProject(projectId, projectData, token) {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
    return await response.json();
  },

  async deleteProject(projectId, token) {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  // Check-ins
  async createCheckin(projectId, checkinData, token) {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/checkin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkinData)
    });
    return await response.json();
  },

  async getProjectCheckins(projectId, token) {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/checkins`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  // Activity Feeds
  async getGlobalActivity(token) {
    const response = await fetch(`${API_BASE}/api/activity/global`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async getLocalActivity(token) {
    const response = await fetch(`${API_BASE}/api/activity/local`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  // Search
  async search(query, type = null, token) {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);
    
    const response = await fetch(`${API_BASE}/api/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  // Saved Projects
  async getSavedProjects(token) {
    const response = await fetch(`${API_BASE}/api/users/saved-projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  // Messaging
  async getConversations(token) {
    const response = await fetch(`${API_BASE}/api/messages/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async getMessages(friendUsername, token) {
    const response = await fetch(`${API_BASE}/api/messages/${friendUsername}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async sendMessage(friendUsername, content, token) {
    const response = await fetch(`${API_BASE}/api/messages/${friendUsername}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    return await response.json();
  },

  // Admin Routes
  async getAdminUsers(token) {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async updateAdminUser(username, userData, token) {
    const response = await fetch(`${API_BASE}/api/admin/users/${username}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return await response.json();
  },

  async deleteAdminUser(username, token) {
    const response = await fetch(`${API_BASE}/api/admin/users/${username}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async getAdminProjects(token) {
    const response = await fetch(`${API_BASE}/api/admin/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async updateAdminProject(projectId, projectData, token) {
    const response = await fetch(`${API_BASE}/api/admin/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
    return await response.json();
  },

  async deleteAdminProject(projectId, token) {
    const response = await fetch(`${API_BASE}/api/admin/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async getAdminCheckins(token) {
    const response = await fetch(`${API_BASE}/api/admin/checkins`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async updateAdminCheckin(checkinId, checkinData, token) {
    const response = await fetch(`${API_BASE}/api/admin/checkins/${checkinId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkinData)
    });
    return await response.json();
  },

  async deleteAdminCheckin(checkinId, token) {
    const response = await fetch(`${API_BASE}/api/admin/checkins/${checkinId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  }
};