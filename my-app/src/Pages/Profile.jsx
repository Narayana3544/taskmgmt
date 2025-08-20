import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try { 
      await axios.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true });
       navigate('/login'); // Redirect to login page
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  if (error) return <div>{error}</div>;
  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-heading">👤 User Profile</h2>
        <div className="profile-actions">
          <button className="settings-button" onClick={goToSettings}>⚙️ Settings</button>
          <button className="logout-button" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-field">
          <label>Full Name</label>
          <p>{user.first_name} {user.last_name}</p>
        </div>
        <div className="profile-field">
          <label>Preferred Name</label>
          <p>{user.preffered_name}</p>
        </div>
        <div className="profile-field">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="profile-field">
          <label>Role</label>
          <p>{user.role.description}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
