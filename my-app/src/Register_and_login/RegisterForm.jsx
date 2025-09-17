import React, { useState } from 'react';
import api from '../api';
import { FaUser, FaEnvelope, FaLock, FaUserCircle, FaRegUser } from 'react-icons/fa';
import './RegisterForm.css';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preffered_name: '',
    email: '',
    password: '',
    role_id: '1', // default role
  });

  const [popup, setPopup] = useState({
    show: false,
    message: '',
    type: '', // 'success' or 'error'
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
  const { first_name, last_name, email, password } = formData;

  if (!first_name || !last_name || !email || !password) {
    setPopup({ show: true, message: "All fields are required!", type: "error" });
    return false;
  }

  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setPopup({ show: true, message: "Invalid email format!", type: "error" });
    return false;
  }

  if (password.length < 6) {
    setPopup({ show: true, message: "Password must be at least 6 characters!", type: "error" });
    return false;
  }

  return true;
};


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return; // stop if validation fails

  try {
    const res = await api.post('/register', formData);

    if (res.status === 201) {
      setPopup({ show: true, message: res.data, type: "success" });
      setFormData({ first_name: '', last_name: '', preffered_name: '', email: '', password: '', role_id: '1' });

      setTimeout(() => {
        setPopup({ show: false, message: '', type: '' });
        navigate('/login');
      }, 2000);
    }
  } catch (err) {
    if (err.response?.status === 409) {
      setPopup({ show: true, message: err.response.data || "Email already exists!", type: "error" });
    } else {
      setPopup({ show: true, message: err.response?.data || "Registration failed!", type: "error" });
    }
  }
};


  return (
    <div className="auth-container">

      {/* Top toggle to go back to login */}
      <div className="top-toggle">
        <button onClick={() => navigate('/')} className="top-toggle-button">
          Login
        </button>
      </div>

      {/* Registration Form */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="login-icon"><FaUserCircle size={48} /></div>
        <h4>Create an Account</h4>
        <h2>Join us!</h2>

        <div className="input-group">
          <FaUser className="input-icon" />
          <input
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="First Name"
            required
          />
        </div>

        <div className="input-group">
          <FaRegUser className="input-icon" />
          <input
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            required
          />
        </div>

        <div className="input-group">
          <FaUser className="input-icon" />
          <input
            name="preffered_name"
            value={formData.preffered_name}
            onChange={handleChange}
            placeholder="Preferred Name"
          />
        </div>

        <div className="input-group">
          <FaEnvelope className="input-icon" />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </div>

        <div className="input-group">
          <FaLock className="input-icon" />
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
        </div>

        <button type="submit">Register</button>
      </form>

      {/* Popup for status messages */}
      {popup.show && (
        <div className={`popup ${popup.type}`}>
          <p>{popup.message}</p>
          {popup.type === 'error' && (
            <button onClick={() => setPopup({ show: false, message: '', type: '' })}>
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
