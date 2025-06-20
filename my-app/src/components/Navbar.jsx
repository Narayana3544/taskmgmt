import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { FaBars } from 'react-icons/fa';


const Navbar = ({collapsed, onToggleSidebar }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    

    <nav className={`main-navbar ${collapsed ? 'collapsed' : ''}`}>

      <div className="navbar-left">
        <div className="hamburger-left" onClick={onToggleSidebar}>
          <FaBars />
        </div>
        <div className="logo">
         TaskBoard
        </div>
      </div>
      

      <div className="hamburger" onClick={handleToggle}>
        <FaBars />
      </div>

      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><Link to="/home" onClick={() => setIsOpen(false)}>Home</Link></li>
        <li><Link to="/tasks" onClick={() => setIsOpen(false)}>Tasks</Link></li>
        <li><Link to="/profile" onClick={() => setIsOpen(false)}>Profile</Link></li>
        <li><Link to="/settings" onClick={() => setIsOpen(false)}>Settings</Link></li>
        <li><Link to="/" onClick={() => setIsOpen(false)}>Logout</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
