import React from 'react';
import './Profile.css';
import { FaUserCircle, FaEnvelope, FaIdBadge } from 'react-icons/fa';

const Profile = () => {
  const user = {
    firstname: 'Narayana',
    lastname: 'Telusko',
    preferredName: 'Narayana',
    email: 'narayana@example.com',
    role: 'Developer'
  };

  return (
    <div className="profile-container">
      <h2 className="profile-heading">👤 User Profile</h2>

      <div className="profile-card">
        <FaUserCircle className="profile-icon" />

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
          <p><FaEnvelope className="profile-icon-mini" /> {user.email}</p>
        </div>

        <div className="profile-field">
          <label>Role</label>
          <p><FaIdBadge className="profile-icon-mini" /> {user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
