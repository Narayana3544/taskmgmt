import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserStories.css';

const UserStories = () => {
  const [featureId, setFeatureId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchUserId, setSearchUserId] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [story, setStory] = useState({
    description: '',
    acceptancecriteria: '',
    storypoints: '',
    assignedTo: '',
    status: 'To Do'
  });

  useEffect(() => {
    // Fetch users
    axios.get('http://localhost:8080/api/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  useEffect(() => {
    if (searchUserId.trim() === '') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => u.id.toString().includes(searchUserId)));
    }
  }, [searchUserId, users]);

  const handleSubmitFeatureId = () => {
    if (featureId.trim()) setShowForm(true);
  };

  const handleStoryChange = (e) => {
    const { name, value } = e.target;
    setStory(prev => ({ ...prev, [name]: value }));
  };

  const handleStorySubmit = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:8080/api/features/${featureId}/adduserstory`, {
  description: story.description,
  acceptancecriteria: story.acceptancecriteria,
  storypoints: story.storypoints,
  status: story.status,
  userstory: { id: story.assignedTo }
}).
then(() => {
        alert('User story added successfully!');
        setStory({
          description: '',
          acceptancecriteria: '',
          storypoints: '',
          assignedTo: '',
          status: 'To Do'
        });
      })
      .catch(err => {
        console.error('Error saving user story:', err);
        alert('Error saving user story');
      });
  };

  return (
    <div className="user-stories-page">
      <h2>User Stories</h2>

      <div className="feature-id-form">
        <label>Enter Feature ID:</label>
        <input type="text" value={featureId} onChange={(e) => setFeatureId(e.target.value)} />
        <button onClick={handleSubmitFeatureId}>Load Form</button>
      </div>

      {showForm && (
        <form onSubmit={handleStorySubmit} className="story-form">
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={story.description} onChange={handleStoryChange} required />
          </div>

          <div className="form-group">
            <label>Acceptance Criteria</label>
            <textarea name="acceptancecriteria"  value={story.acceptancecriteria} onChange={handleStoryChange} required  />
          </div>

          <div className="form-group">
            <label>Story Points</label>
            <input name="storypoints" type="number" value={story.storypoints} onChange={handleStoryChange} required />
          </div>

          <div className="form-group">
            <label>Assigned To (User)</label>
            <input
              type="text"
              placeholder="Search by user ID"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
            />
            <select name="assignedTo" value={story.assignedTo} onChange={handleStoryChange} required>
              <option value="">-- Select a user --</option>
              {filteredUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name} (ID: {user.id})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={story.status} onChange={handleStoryChange}>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">Add Story</button>
        </form>
      )}
    </div>
  );
};

export default UserStories;
