import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaUserCircle, FaRegUser } from 'react-icons/fa';
import './RegisterForm.css';
import { useNavigate } from 'react-router-dom';




const RegisterForm = ({ onToggle }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preffered_name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

  

    try {
      const res = await axios.post('http://localhost:8080/api/register', formData);

      if (res.status === 200) {
        toast.success(' Registered Successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });

        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          preffered_name: '',
          email: '',
          password: '',
        });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('⚠️ Email already exists!');
      } else {
        toast.error('❌ Registration failed!');
        console.error(err);
      }
    }
  };

  return (
    
    <div className="auth-container">
     <div className="top-toggle">
  <button onClick={() => navigate('/')} className="top-toggle-button">
    Login
  </button>
</div>


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
    </div>
  );
};

export default RegisterForm;
