import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEdit } from "react-icons/fa";

const ViewFeaturesByProjectId = () => {
  const [features, setFeatures] = useState([]);
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const [searchProjectId, setSearchProjectId] = useState('');
  const navigate = useNavigate();
  const { projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      axios
        .get(`http://localhost:8080/api/features/project/${projectId}`, { withCredentials: true })
        .then((res) => {
          setFeatures(res.data);
          setFilteredFeatures(res.data); // ✅ initialize filteredFeatures as well
        })
        .catch((err) => console.error("Error fetching features:", err));
    }
  }, [projectId]);

  const handleSearch = () => {
    if (searchProjectId.trim() === '') {
      setFilteredFeatures(features);
    } else {
      const filtered = features.filter(
        (feature) => feature.project?.id?.toString() === searchProjectId.trim()
      );
      setFilteredFeatures(filtered);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      axios
        .delete(`http://localhost:8080/api/features/${id}`, { withCredentials: true })
        .then(() => {
          const updated = features.filter((f) => f.id !== id);
          setFeatures(updated);
          setFilteredFeatures(updated);
        })
        .catch((err) => console.error('Error deleting feature:', err));
    }
  };

  return (
    <div className="features-list-page">
      <div className="header-bar">
        <h2>📋 Features for Project {projectId}</h2>
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
              {/* <th>Project Name</th> */}
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
                {/* <td>{feature.project?.name}</td> */}
                <td>{feature.name}</td>
                <td>{feature.description}</td>
                <td>
                  <span
                    className={`status-tag ${
                      feature.status?.description?.toLowerCase().replace(/\s+/g, '-') || ''
                    }`}
                  >
                    {feature.status?.decription || 'No status'}
                  </span>
                </td>
                <td>
                   <button 
                    className="view-btn" 
                    onClick={() => navigate(`/ViewSprintsByFeatureid/${feature.id}`)}
                  >
                    View Sprints
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewFeaturesByProjectId;
