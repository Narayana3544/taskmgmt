import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FeatureList.css';

const FeatureList = () => {
  const [features, setFeatures] = useState([]);
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const [searchProjectId, setSearchProjectId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8080/api/features')
      .then(res => {
        setFeatures(res.data);
        setFilteredFeatures(res.data);
      })
      .catch(err => {
        console.error('Error fetching features:', err);
      });
  }, []);

  const handleSearch = () => {
    if (searchProjectId.trim() === '') {
      setFilteredFeatures(features);
    } else {
      const filtered = features.filter(
        feature => feature.project_id?.toString() === searchProjectId.trim()
      );
      setFilteredFeatures(filtered);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-feature/${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      axios.delete(`http://localhost:8080/api/features/${id}`)
        .then(() => {
          const updated = features.filter(f => f.id !== id);
          setFeatures(updated);
          setFilteredFeatures(updated);
        })
        .catch(err => console.error('Error deleting feature:', err));
    }
  };

  return (
    <div className="features-list-page">
      <div className="header-bar">
        <h2>📋 All Features</h2>
        <button className="create-feature-btn" onClick={() => navigate('/features')}>+ Create Feature</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Project ID"
          value={searchProjectId}
          onChange={(e) => setSearchProjectId(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {filteredFeatures.length === 0 ? (
        <p>No features found.</p>
      ) : (
        <table className="features-table">
          <thead>
            <tr>
              <th>Feature ID</th>
              <th>Project ID</th>
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
                <td>{feature.project?.id}</td>
                <td>{feature.name}</td>
                <td>{feature.descriptor}</td>
                <td>
                  <span className={`status-tag ${feature.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {feature.status}
                  </span>
                </td>
                <td>
                  <div className="button-group">
                    <button className="edit-btn" onClick={() => handleEdit(feature.id)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(feature.id)}>Delete</button>
                    <button className="view-btn" onClick={() => navigate(`/features/${feature.id}/userstories`)}>View Stories</button>
                    <button className="add-btn" onClick={() => navigate(`/features/${feature.id}/add-userstory`)}>Add Story</button>
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
