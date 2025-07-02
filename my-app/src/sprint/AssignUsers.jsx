// src/pages/AssignUsersToSprint.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AssignUsersToSprint.css';

const AssignUsersToSprint = () => {
  const [sprintId, setSprintId] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  const handleCheckboxChange = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = () => {
    if (!sprintId) {
      alert('Please enter a Sprint ID');
      return;
    }

    axios.post(`http://localhost:8080/api/sprints/${sprintId}/assign-users`, selectedUsers)
      .then(() => {
        alert('Users assigned to sprint!');
        setSelectedUsers([]);
        setSprintId('');
      })
      .catch(err => {
        console.error('Error assigning users:', err);
        alert('Failed to assign users.');
      });
  };

  return (
    <div className="assign-sprint-container">
      <h2>👥 Assign Users to Sprint</h2>

      <label>Enter Sprint ID:</label>
      <input
        type="text"
        value={sprintId}
        onChange={(e) => setSprintId(e.target.value)}
        placeholder="Sprint ID"
      />

      <h3>Select Users:</h3>
      <ul className="user-list">
        {users.map(user => (
          <li key={user.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => handleCheckboxChange(user.id)}
              />
              {user.name} (ID: {user.id})
            </label>
          </li>
        ))}
      </ul>

      <button className="assign-btn" onClick={handleAssign}>Assign Users</button>
    </div>
  );
};

export default AssignUsersToSprint;
