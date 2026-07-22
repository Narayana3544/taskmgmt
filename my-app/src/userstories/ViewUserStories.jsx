import React, { useState, useEffect } from 'react';
import api from '../api';
import './ViewUserStories.css';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from "react-icons/fa";
import StatusSummary from '../components/StatusSummary';


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
  api.get('/features/userstories', { withCredentials: true })
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
    if (!window.confirm("Are you sure you want to change the status?")) {
      return;
    }

    api.patch(`/userstories/${storyId}/status`, { status: newStatus }, { withCredentials: true })
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
      api.delete(`/userstories/${id}`, { withCredentials: true })
        .then(() => fetchAllStories())
        .catch(err => console.error('Error deleting story:', err));
    }
  };

  return (
    <div className="view-stories-container">
      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>📋 All User Stories</h2>

        {/* Search inline */}
        <div className="search-form" style={{ display: 'flex', gap: '8px', flex: 1, margin: 0 }}>
          <input
            type="text"
            placeholder="Search by Feature ID"
            value={featureIdSearch}
            onChange={(e) => setFeatureIdSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', minWidth: '200px' }}
          />
          <button onClick={handleSearch} style={{ padding: '8px 16px', borderRadius: '6px', background: '#0275d8', color: 'white', border: 'none', cursor: 'pointer' }}>Search</button>

          <StatusSummary data={filteredStories} statusExtractor={(story) => story.status?.decription || story.status || 'Unknown'} />
        </div>

        <button className="create-btn" onClick={() => navigate('/userstories')} style={{ flexShrink: 0 }}>
          + Create User Story
        </button>
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
