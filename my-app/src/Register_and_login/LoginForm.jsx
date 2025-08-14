import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserCircle } from 'react-icons/fa';
import './LoginForm.css';

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = loginData; // ✅ extract values

    try {
      const res = await axios.post(
        "http://localhost:8080/api/login",
        { email, password },
        { withCredentials: true }
      );

      if (res.status === 200) {
        
        toast.success('✅ Login Successful!');
        onLogin(); // ✅ Update parent login state
        setTimeout(() => navigate('/home'), 1000);
      }
    } catch (err) {
      toast.error('❌ Invalid credentials');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="login-icon">
          <FaUserCircle size={48} />
        </div>
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

      <div className="top-toggle">
        <button onClick={() => navigate('/register')} className="top-toggle-button">
          Register
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
