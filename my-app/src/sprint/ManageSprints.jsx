import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageSprints.css';
import { useNavigate } from 'react-router-dom';

const ManageSprints = () => {
  const [sprints, setSprints] = useState([]);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSprints();
    fetchUser();
  }, []);

  const fetchSprints = () => {
    axios.get('http://localhost:8080/api/sprints', { withCredentials: true })
      .then(res => setSprints(res.data))
      .catch(err => console.error('Error fetching sprints:', err));
  };

  const fetchUser = () => {
    axios.get('http://localhost:8080/api/user/profile', { withCredentials: true })
      .then(res => {
        const user = res.data;
        setUserName(user.preffered_name || user.username || "User");
      })
      .catch(err => console.error('Error fetching user profile:', err));
  };

  const deleteSprint = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this sprint?");
    if (!confirmDelete) return;

    axios.delete(`http://localhost:8080/api/sprints/${id}`, { withCredentials: true })
      .then(() => {
        alert("Sprint deleted successfully.");
        fetchSprints(); // Refresh list
      })
      .catch(err => {
        console.error("Error deleting sprint:", err);
        alert("Failed to delete sprint.");
      });
  };

  const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString() : "-";
  };

  return (
    <div className="manage-sprints-page">
      <div className="sprint-header">
        <h2>📅 Manage Sprints</h2>
        <div className="top-actions">
          <span className="user-label">{userName}</span>
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
              <td>{formatDate(sprint.startDate)}</td>
              <td>{formatDate(sprint.endDate)}</td>
              <td>{sprint.feature?.name || '-'}</td>
              <td>
                <button className="view-btn" onClick={() => navigate(`/Viewtaskbysprint/${sprint.id}`)}>View</button>
                <button className="delete-btn" onClick={() => deleteSprint(sprint.id)}>Delete</button>
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

export default ManageSprints;
