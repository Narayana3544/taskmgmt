import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from '../api';
import "./Navbar.css";
import { FaUserCircle, FaCog, FaSignOutAlt } from "react-icons/fa";

const Navbar = ({ collapsed }) => {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/user/profile', { withCredentials: true })
      .then(response => setUser(response.data))
      .catch(error => console.error('Error fetching user profile:', error));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={`top-navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="navbar-brand">
        <a 
          href="https://www.winfocus.co.in/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="company-logo" 
          style={{ textDecoration: 'none', color: 'white' }}
        >
          winfocus.co.in
        </a>
      </div>

      {user && (
        <div className="navbar-right" ref={dropdownRef} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="nav-dropdown-container">
            <button 
              className="profile-btn" 
              onClick={() => setActiveDropdown(!activeDropdown)}
              style={{ borderRadius: '50%', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FaUserCircle className="profile-icon" size={28} style={{ margin: 0 }} />
            </button>
            {activeDropdown && (
              <div className="nav-dropdown-menu right-aligned" style={{ minWidth: '180px', padding: '8px 0' }}>
                <div style={{ padding: '8px 20px', borderBottom: '1px solid #eaeaea', marginBottom: '4px' }}>
                  <div style={{ display: 'block', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                    {user.first_name} {user.last_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {user.role?.description}
                  </div>
                </div>
                <Link to="/profile" className="dropdown-item" onClick={() => setActiveDropdown(false)}>
                  <FaUserCircle /> Profile
                </Link>
                <Link to="/view-projectsByUserId" className="dropdown-item" onClick={() => setActiveDropdown(false)}>
                  <FaCog /> My Projects
                </Link>
                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4px 0' }} />
                <Link to="/logout" className="dropdown-item logout-link" onClick={() => setActiveDropdown(false)}>
                  <FaSignOutAlt /> Log out
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
