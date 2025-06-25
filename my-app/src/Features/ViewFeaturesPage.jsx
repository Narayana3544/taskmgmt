import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewFeaturesPage.css';

const ViewFeaturesPage = () => {
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!projectId.trim()) {
      setError('Project ID is required.');
      return;
    }

    // ✅ Navigate to dynamic route
    navigate(`/features/${projectId}`);
  };

  return (
    <div className="view-features-page">
      <h2>🔍 View Features by Project ID</h2>

      <form onSubmit={handleSubmit} className="project-search-form">
        <input
          type="text"
          placeholder="Enter Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
        <button type="submit">Fetch Features</button>
      </form>

      {error && <p className="error-msg">{error}</p>}
    </div>
  );
};

export default ViewFeaturesPage;
