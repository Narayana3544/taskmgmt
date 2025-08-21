import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageSprints.css';
import { useNavigate, useParams } from 'react-router-dom';

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
    axios.get(`http://localhost:8080/api/features/${featureId}/sprints`, { withCredentials: true })
      .then(res => setSprints(res.data))
      .catch(err => console.error('Error fetching sprints:', err));
  };

  const fetchUser = () => {
    axios.get('http://localhost:8080/api/user/profile', { withCredentials: true })
      .then(res => {
        const user = res.data;
        setUserName(user.preffered_name);
      })
      .catch(err => console.error('Error fetching user profile:', err));
  };

  return (
    <div className="manage-sprints-page">
      <div className="sprint-header">
        <h2>📅 Your Sprints</h2>
        <div className="top-actions">
          <span className="user-label">👤 {userName}</span>
          <button className="create-sprint-btn" onClick={() => navigate('/create-sprint')}>+ Create Sprint</button>
        </div>
      </div>

      <table className="sprint-table">
        <thead>
          <tr>
            <th>Sprint ID</th>
            <th>Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Feature Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sprints.map((sprint) => (
            <tr key={sprint.id}>
              <td>{sprint.id}</td>
              <td>{sprint.name}</td>
              <td>{sprint.startDate}</td>
              <td>{sprint.endDate}</td>
              <td>{sprint.feature.name}</td>
              <td>
                <button onClick={() => navigate(`/sprints/${sprint.id}/overview`)}>view</button>
              </td>
            </tr>
          ))}
          {sprints.length === 0 && (
            <tr>
              <td colSpan="6">No sprints found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ViewSprintsByFeatureid;
