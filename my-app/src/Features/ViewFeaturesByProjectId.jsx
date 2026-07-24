import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEdit } from "react-icons/fa";
import { sortLatestFirst } from "../utils/sortUtils";

const ViewFeaturesByProjectId = () => {
  const [features, setFeatures] = useState([]);
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const [searchProjectId, setSearchProjectId] = useState('');
  const navigate = useNavigate();
  const { projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      api
        .get(`/features/project/${projectId}`, { withCredentials: true })
        .then((res) => {
          const sorted = sortLatestFirst(res.data);
          setFeatures(sorted);
          setFilteredFeatures(sorted); // ✅ initialize filteredFeatures as well
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
      api
        .delete(`/features/${id}`, { withCredentials: true })
        .then(() => {
          const updated = features.filter((f) => f.id !== id);
          setFeatures(updated);
          setFilteredFeatures(updated);
        })
        .catch((err) => console.error('Error deleting feature:', err));
    }
  };


  const projectName = features.length > 0 ? features[0].project?.name : projectId;

  return (
    <div className="features-list-page">
      <div className="header-bar">
        <h2>Features for Project: {projectName}</h2>
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
              {/* <th>Actions</th> */}
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
                    className={`status-tags ${
                      feature.status?.description?.toLowerCase().replace(/\s+/g, '-') || ''
                    }`}
                  >
                    {feature.status?.decription || 'No status'}
                  </span>
                </td>
                {/* <td>
                   <button 
                    className="view-btn" 
                    onClick={() => navigate(`/ViewSprintsByFeatureid/${feature.id}`)}
                  >
                    View Sprints
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="btn-container full-width" style={{ marginTop: '20px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
};

export default ViewFeaturesByProjectId;
