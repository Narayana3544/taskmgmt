import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ViewUserStories.css';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from "react-icons/fa";


const ViewStories = () => {
  const [allStories, setAllStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [featureIdSearch, setFeatureIdSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllStories();
  }, []);

 const fetchAllStories = () => {
  axios.get('http://localhost:8080/api/features/userstories', { withCredentials: true })
    .then(res => {
      const stories = Array.isArray(res.data) ? res.data : [];
      setAllStories(stories);
      setFilteredStories(stories);
    })
    .catch(err => {
      console.error('Error fetching stories:', err);
      setError('Failed to load user stories.');
    });
};

  const handleSearch = () => {
    if (!featureIdSearch.trim()) {
      setFilteredStories(allStories);
    } else {
      const filtered = allStories.filter(
        story => story.feature?.id?.toString() === featureIdSearch.trim()
      );
      setFilteredStories(filtered);
    }
  };

  const handleStatusChange = (storyId, newStatus) => {
    axios.patch(`http://localhost:8080/api/userstories/${storyId}/status`, { status: newStatus }, { withCredentials: true })
      .then(() => {
        const updated = filteredStories.map(story =>
          story.id === storyId ? { ...story, status: newStatus } : story
        );
        setFilteredStories(updated);
      })
      .catch(err => {
        console.error('Failed to update status:', err);
        alert('Error updating status');
      });
  };
  

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      axios.delete(`http://localhost:8080/api/userstories/${id}`, { withCredentials: true })
        .then(() => fetchAllStories())
        .catch(err => console.error('Error deleting story:', err));
    }
  };

  return (
    <div className="view-stories-container">
      <div className="header-row">
        <h2>📋 All User Stories</h2>
        <button className="create-btn" onClick={() => navigate('/userstories')}>
          + Create User Story
        </button>
      </div>

      <div className="search-form">
        <input
          type="text"
          placeholder="Search by Feature ID"
          value={featureIdSearch}
          onChange={(e) => setFeatureIdSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {error && <p className="error">{error}</p>}

      {filteredStories.length > 0 ? (
        <div className="story-table-section">
          <table className="story-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Acceptance Criteria</th>
                <th>Story Points</th>
                <th>Status</th>
                <th>Feature ID</th>
                <th>Report To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStories.map((story) => (
                <tr key={story.id}>
                  <td>{story.id}</td>
                  <td>{story.description}</td>
                  <td>{story.acceptancecriteria}</td>
                  <td>{story.storypoints}</td>
                  <td>
                    <select
                      value={story.status}
                      onChange={(e) => handleStatusChange(story.id, e.target.value)}
                    >
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                  </td>
                  <td>{story.feature?.id || 'N/A'}</td>
                  <td>{story.userstory?.preffered_name || 'N/A'}</td>
                  <td>
                  <button 
                    className="edit-btn" 
                    onClick={() => navigate(`/edit-userstory/${story.id}`)}
                  > 
                      <FaEdit />
                  </button>
                </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No user stories found.</p>
      )}
    </div>
  );
};

export default ViewStories;
