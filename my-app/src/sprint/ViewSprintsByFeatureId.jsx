import React, { useEffect, useState } from 'react';
import api from '../api';
import './ManageSprints.css';
import { FaEye } from 'react-icons/fa';

import { useNavigate, useParams } from 'react-router-dom';
import { sortLatestFirst } from "../utils/sortUtils";

const ViewSprintsByFeatureid = () => {
  const [sprints, setSprints] = useState([]);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const {featureId}=useParams();

  useEffect(() => {
    fetchSprints();
    fetchUser();
  }, [featureId]);

  const fetchSprints = () => {
    api.get(`/features/${featureId}/sprints`, { withCredentials: true })
      .then(res => setSprints(sortLatestFirst(res.data)))
      .catch(err => console.error('Error fetching sprints:', err));
  };

  const fetchUser = () => {
    api.get('/user/profile', { withCredentials: true })
      .then(res => {
        const user = res.data;
        setUserName(user.preffered_name);
      })
      .catch(err => console.error('Error fetching user profile:', err));
  };

  return (
    <div className="manage-sprints-page">
      <div className="sprint-header">
        <h2>Your Sprints</h2>
      </div>

      <table className="sprint-table">
        <thead>
          <tr>
            <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Sprint ID</th>
            <th style={{ minWidth: '150px' }}>Name</th>
            <th style={{ width: '110px', whiteSpace: 'nowrap' }}>Start Date</th>
            <th style={{ width: '110px', whiteSpace: 'nowrap' }}>End Date</th>
            <th style={{ minWidth: '150px' }}>Feature Name</th>
            <th style={{ width: '90px', whiteSpace: 'nowrap' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
           {sprints.length > 0 ? (
            sprints.map((sprint) => (
              <tr key={sprint.id}>
                <td>{sprint.id}</td>
                <td>{sprint.name}</td>
                <td>{sprint.startDate}</td>
                <td>{sprint.endDate}</td>
                <td>{sprint.feature?.name}</td>
                <td>
                  <button
                  title="View Sprint Overview"
                  onClick={() => navigate(`/sprints/overview/${sprint.id}`)}
                  style={{
                    border: "none",
                    background: "#e9f2ff",
                    color: "#007bff",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "17px",
                    transition: "0.2s",
                    margin: "0 auto" 
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#007bff";
                    e.target.style.color = "#fff";
                    e.target.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#e9f2ff";
                    e.target.style.color = "#007bff";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  <FaEye />
                </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No sprints found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="btn-container full-width" style={{ marginTop: '20px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
};

export default ViewSprintsByFeatureid;
