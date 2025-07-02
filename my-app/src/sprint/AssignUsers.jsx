import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './AssignUsersToSprint.css';

const AssignUsersToSprint = () => {
  const { sprintId } = useParams();
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8080/api/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAssign = () => {
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user.');
      return;
    }

    axios.post(`http://localhost:8080/api/sprints/${sprintId}/assign-users`, selectedUserIds)
      .then(() => {
        alert('Users assigned successfully!');
        navigate('/manage-sprints');
      })
      .catch(err => {
        console.error('Error assigning users:', err);
        alert('Failed to assign users.');
      });
  };

  return (
    <div className="assign-users-page">
      <h2>👥 Assign Users to Sprint ID: {sprintId}</h2>

      <ul className="user-list">
        {users.map((user) => (
          <li key={user.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedUserIds.includes(user.id)}
                onChange={() => toggleUserSelection(user.id)}
              />
              {user.name} (ID: {user.id})
            </label>
          </li>
        ))}
      </ul>

      <button className="assign-btn" onClick={handleAssign}>✅ Assign Selected Users</button>
    </div>
  );
};

export default AssignUsersToSprint;
