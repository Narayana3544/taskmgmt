import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import './FeatureList.css';
import { FaEdit, FaEye } from 'react-icons/fa'; // ✅ Icons

const FeatureList = () => {
  const [features, setFeatures] = useState([]);
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/features', { withCredentials: true })
      .then(res => {
        setFeatures(res.data);
        setFilteredFeatures(res.data);
      })
      .catch(err => console.error('Error fetching features:', err));
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFeatures(features);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = features.filter(feature =>
        JSON.stringify(feature).toLowerCase().includes(term)
      );
      setFilteredFeatures(filtered);
    }
  }, [searchTerm, features]);

  return (
    <div className="features-list-page">
      <div className="header-bar">
        <h2>Features</h2>
        <button className="create-feature-btn" onClick={() => navigate('/features')}>
          + Create Feature
        </button>
      </div>

      {/* 🔍 Medium Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="medium-search-input"
        />
      </div>

      {filteredFeatures.length === 0 ? (
        <p>No features found.</p>
      ) : (
        <table className="features-table">
          <thead>
            <tr>
              <th>Feature ID</th>
              <th>Project Name</th>
              <th>Feature Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeatures.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.id}</td>
                <td>{feature.project?.name}</td>
                <td>{feature.name}</td>
                <td>{feature.description}</td>
                <td>
                  <span className="status">
                    {feature.status?.decription || 'Unknown'}
                  </span>
                </td>
                <td className="action-buttons">
                  {/* 🖊️ Edit */}
                  <div className="tooltip">
                    <FaEdit
                      className="icon-btn edit-icon"
                      onClick={() => navigate(`/edit-feature/${feature.id}`)}
                    />
                    <span className="tooltip-text">Edit Feature</span>
                  </div>

                  {/* 👁️ View Sprints */}
                  <div className="tooltip">
                    <FaEye
                      className="icon-btn view-icon"
                      onClick={() => navigate(`/ViewSprintsByFeatureid/${feature.id}`)}
                    />
                    <span className="tooltip-text">View Sprints</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FeatureList;