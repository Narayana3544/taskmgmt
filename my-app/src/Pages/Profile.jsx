import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8080/api/user/profile', { withCredentials: true })
      .then(response => {
        setUser(response.data);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile');
      });
  }, []);

  if (error) return <div>{error}</div>;
  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="profile-container">
      <h2 className="profile-heading">👤 User Profile</h2>
      <div className="profile-card">
        <div className="profile-field">
          <label>Full Name</label>
          <p>{user.firstname} {user.lastname}</p>
        </div>
        <div className="profile-field">
          <label>Preferred Name</label>
          <p>{user.preferredName}</p>
        </div>
        <div className="profile-field">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="profile-field">
          <label>Role</label>
          <p>{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
