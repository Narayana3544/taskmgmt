import React, { useState } from 'react';
import './Sidebar.css';
import {
  FaTachometerAlt, FaBell, FaEnvelope,
  FaUserCircle, FaPlusCircle, FaChartBar, FaCog,
  FaSignOutAlt, FaFileInvoiceDollar, FaBars, FaUser, FaThList
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ onToggle }) => {
  const [openDashboard, setOpenDashboard] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => {
    setCollapsed(!collapsed);
    if (onToggle) onToggle(!collapsed);
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={handleToggle}>
        <FaBars />
      </div>
      

      <div className={`sidebar-content ${collapsed ? 'collapse-anim' : 'expand-anim'}`}>
        {!collapsed && (
          <>
            <div className="profile-section">
              <FaUserCircle className="profile-icon" />
              <div>
                <p className="profile-name">Narayana</p>
                <p className="profile-role">Software Development engineer-1 </p>
              </div>
            </div>

            <div className="nav-section">
              <div className="nav-item" onClick={() => setOpenDashboard(!openDashboard)}>
                <FaTachometerAlt />
                <span>Dashboard</span>
              </div>
              {openDashboard && (
                <div className="submenu">
                  <div className="nav-subitem" onClick={() => navigate('/dashboard')}><FaThList /> Board</div>
                  <div className="nav-subitem"onClick={() => navigate('/my-stories')}><FaChartBar /> Activity</div>
                  <div className="nav-subitem"><FaChartBar /> Statistics</div>
                </div>
              )}

              {/* ✅ Updated navigation to pages */}

            <div className="nav-item" onClick={() => navigate('/manage-projects')}>
              <FaFileInvoiceDollar /><span>Projects</span>
              </div>
                <div className="nav-item" onClick={() => navigate('/view-features')}>
              <FaFileInvoiceDollar /><span>Features</span>
              </div>
               <div className="nav-item" onClick={() => navigate('/view-stories')}>
              <FaFileInvoiceDollar /><span>User Stories</span>
              </div>
<div className="nav-item" onClick={() => navigate('/manage-sprints')}>
  <FaChartBar /><span>Sprints</span>
</div>

              <div className="nav-item"><FaBell /><span>Notifications</span></div>
              <div className="nav-item" onClick={() => navigate('/profile')}><FaUser /><span>Profile</span></div>
            </div>

            <div className="messages-section">
              <p className="section-title">MESSAGES</p>
              <div className="message-item"><FaEnvelope /><span>Erik Gunsel</span></div>
              <div className="message-item"><FaEnvelope /><span>Emily Smith</span></div>
              <div className="message-item"><FaEnvelope /><span>Arthur Adelk</span></div>
            </div>

            <div className="task-button">
              <button><FaPlusCircle /> Add New Task</button>
            </div>
            <div className="bottom-section">
              <div className="nav-item"><FaCog /><span>Settings</span></div>
              <div className="nav-item" onClick={() => navigate('/')}><FaSignOutAlt /><span>Logout</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
