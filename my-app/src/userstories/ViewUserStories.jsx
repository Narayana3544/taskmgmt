import React, { useState } from 'react';
import axios from 'axios';
import './ViewUserStories.css';

const ViewStories = () => {
  const [featureId, setFeatureId] = useState('');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStories = () => {
    if (!featureId.trim()) {
      alert('Please enter a valid Feature ID.');
      return;
    }

    setLoading(true);
    axios.get(`http://localhost:8080/api/features/${featureId}/userstories`)
      .then((res) => {
        setStories(res.data);
        setError('');
      })
      .catch((err) => {
        console.error('Error fetching stories:', err);
        setError('Failed to fetch stories. Please check the Feature ID.');
        setStories([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="view-stories-container">
      <h2>📋 View User Stories by Feature ID</h2>

      <div className="search-form">
        <label>Enter Feature ID:</label>
        <input
          type="text"
          value={featureId}
          onChange={(e) => setFeatureId(e.target.value)}
          placeholder="Feature ID"
        />
        <button onClick={fetchStories}>Fetch Stories</button>
      </div>

      {loading && <p>Loading stories...</p>}
      {error && <p className="error">{error}</p>}

      {stories.length > 0 && (
        <div className="story-list">
          <h3>Stories for Feature ID: {featureId}</h3>
          <ul>
            {stories.map((story) => (
              <li key={story.id} className="story-card">
                <p><strong>Description:</strong> {story.description}</p>
                <p><strong>Acceptance Criteria:</strong> {story.acceptancecriteria}</p>
                <p><strong>Story Points:</strong> {story.storypoints}</p>
                <p><strong>Status:</strong> {story.status}</p>
                <p><strong>Assigned To:</strong> {story.userstory?.name || 'N/A'}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ViewStories;
