import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { FaUserCircle, FaUser, FaTag, FaLock, FaCog, FaSignOutAlt } from "react-icons/fa";
import { SlArrowDown } from "react-icons/sl";

const Navbar = ({ collapsed, onToggleSidebar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={`main-navbar ${collapsed ? "collapsed" : ""}`}>
      <div className="navbar-left">
        <div className="logo">TaskBoard</div>
      </div>

      <div className="navbar-right" ref={dropdownRef}>
        <div className="profile" onClick={handleToggle}>
          <FaUserCircle className="profile" />
           <SlArrowDown  className="dropdown"/>
          
        </div>

        {isOpen && (
          <div className="dropdown-menu">
            <Link to="/profile" className="dropdown-item">
              <FaUser /> Profile
            </Link>
            {/* <Link to="/tags" className="dropdown-item">
              <FaTag /> Tags
            </Link>
            <Link to="/privacy" className="dropdown-item">
              <FaLock /> Privacy
            </Link> */}
            <Link to="/view-projectsByUserId" className="dropdown-item">
              <FaCog /> Projects
            </Link>
            <Link to="/logout" className="dropdown-item">
              <FaSignOutAlt /> Log out
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

