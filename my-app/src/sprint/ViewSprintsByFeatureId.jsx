import React, { useEffect, useState } from 'react';
import api from '../api';
import './ManageSprints.css';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEye } from 'react-icons/fa'; // 👈 Import Eye icon

const ViewSprintsByFeatureid = () => {
  const [sprints, setSprints] = useState([]);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { featureId } = useParams();

  useEffect(() => {
    fetchSprints();
    fetchUser();
  }, [featureId]);

  const fetchSprints = () => {
    api.get(`/features/${featureId}/sprints`, { withCredentials: true })
      .then(res => setSprints(res.data))
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
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>

      <div className="sprint-header">
        <h2>📅 Your Sprints</h2>
      </div>

      <table className="sprint-table">cd my 
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
                    className="view-btn"
                    title="View Sprint Overview"
                    onClick={() => navigate(`/sprints/overview/${sprint.id}`)}
                  >
                    <FaEye /> {/* 👁 Eye icon */}
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
    </div>
  );
};

export default ViewSprintsByFeatureid;
