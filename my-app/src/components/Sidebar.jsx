import React, { useState ,useEffect} from 'react';
import axios from 'axios';
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


  const [user, setUser] = useState(null);
    const [error, setError] = useState('');
  
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
    if (error) return <div>{error}</div>;
  if (!user) return <div>Loading profile...</div>;

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
                <p className="profile-name">{user.first_name} {user.last_name}</p>
                <p className="profile-role">{user.role.description} </p>
              </div>
            </div>

            <div className="nav-section">
            <div className="nav-item" onClick={() => navigate('/dashboard')}><FaThList /> Dashboard</div>
            <div className="nav-item"onClick={() => navigate('/my-stories')}><FaChartBar /> Current Sprint</div>
            <div className="nav-item" onClick={() => navigate('/manage-projects')}>
              <FaFileInvoiceDollar /><span>Projects</span>
              </div>
                <div className="nav-item" onClick={() => navigate('/view-features')}>
              <FaFileInvoiceDollar /><span>Features</span>
              </div>
               {/* <div className="nav-item" onClick={() => navigate('/view-stories')}>
              <FaFileInvoiceDollar /><span>User Stories</span>
              </div> */}
              <div className="nav-item" onClick={() => navigate('/manage-sprints')}>
                <FaChartBar /><span>Sprints</span>
              </div>
              <div className="nav-item" onClick={() => navigate('/task')}>
                <FaChartBar /><span>Task</span>
              </div>
              {/* <div className="nav-item" onClick={() => navigate('/profile')}><FaUser /><span>Profile</span></div> */}
               <div className="nav-item" onClick={() => navigate('/view-projectsByUserId')}><FaUser /><span>My Projects</span></div>
              <div className="nav-item" onClick={() => navigate('/active-sprints')}>
                <FaChartBar /><span>Your Active Sprints</span>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
