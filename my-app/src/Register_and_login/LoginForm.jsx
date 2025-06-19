import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

import { FaUserCircle, FaEnvelope, FaLock } from 'react-icons/fa';

const LoginForm = ({ onToggle }) => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:8080/api/login', loginData);

      if (res.status === 200) {
        toast.success('Login Successful!');
        setTimeout(() => navigate('/home'), 1000);
      }
    } catch (err) {
      toast.error('Invalid credentials');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="top-toggle">
        <button onClick={onToggle} className="top-toggle-button">Register</button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="login-icon"><FaUserCircle size={48} /></div>
        <h4>Welcome Back</h4>
        <h2>Login</h2>

        <div className="input-group">
          <FaEnvelope className="input-icon" />
          <input
            name="email"
            type="email"
            value={loginData.email}
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
            value={loginData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
