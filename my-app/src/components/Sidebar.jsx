import React, { useState ,useEffect} from 'react';
import api from '../api';
import './Sidebar.css';
import {
  FaClipboardList, FaChevronDown, FaChevronUp ,
  FaUserCircle, FaPlusCircle, FaChartBar, FaCog,
  FaRegCalendarAlt, FaFileInvoiceDollar, FaBars, FaUser, FaThList
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ onToggle }) => {
  const [openDashboard, setOpenDashboard] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
    const [timeSheetOpen, setTimeSheetOpen] = useState(true);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const handleToggle = () => {
    setCollapsed(!collapsed);
    if (onToggle) onToggle(!collapsed);
  };


  const [user, setUser] = useState(null);
    const [error, setError] = useState('');
  
    useEffect(() => {
      api.get('/user/profile', { withCredentials: true })
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
            <div className="nav-item" onClick={() => navigate('/home')}><FaThList /> Dashboard</div>
            <div className="nav-item"onClick={() => navigate('/my-stories')}><FaChartBar /> Current Sprint</div>

            {user.role?.description === "Admin" && (
            <div className="nav-item" onClick={() => navigate('/manage-projects')}>
              <FaFileInvoiceDollar /><span>Projects</span>
              </div>
              )}
              {user.role?.description === "Admin" && (
                <div className="nav-item" onClick={() => navigate('/view-features')}>
              <FaFileInvoiceDollar /><span>Features</span>
              </div>
            )}

                 {user.role?.description === "Admin" && (
                <div className="nav-item" onClick={() => navigate('/manage-sprints')}>
                  <FaChartBar /><span>Sprints</span>
                </div>
              )}



              {/* <div className="nav-item" onClick={() => navigate('/manage-sprints')}>
                <FaChartBar /><span>Sprints</span>
              </div> */}
              {user.role?.description === "Admin" && (
              <div className="nav-item" onClick={() => navigate('/task')}>
                <FaChartBar /><span>Task</span>
              </div>
              )}
              {/* <div className="nav-item" onClick={() => navigate('/profile')}><FaUser /><span>Profile</span></div> */}
               <div className="nav-item" onClick={() => navigate('/view-projectsByUserId')}><FaUser /><span>My Projects</span></div>
              <div className="nav-item" onClick={() => navigate('/active-sprints')}>
                <FaChartBar /><span>Your Active Sprints</span>
              </div>
<div
        className="nav-item "
        onClick={() => setTimeSheetOpen(!timeSheetOpen)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaRegCalendarAlt />
          <span>Time Sheets</span>
        </div>
        {timeSheetOpen ? <FaChevronUp /> : <FaChevronDown />}
      </div>

      {/* Sub-navigation */}
      {timeSheetOpen && (
        <div className="sub-nav" style={{ paddingLeft: "20px", marginTop: "5px" }}>
          <div
            className="nav-item"
            onClick={() => navigate(`/timesheet/${today}`)}
          >
            <FaRegCalendarAlt />
            <span>Daily Time Sheets</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/Monthly-time-sheets")}
          >
            <FaUser />
            <span>Monthly Time Sheets</span>
          </div>
          {user.role?.description === "Admin" && (
            <div
              className="nav-item"
              onClick={() => navigate("/admin/timesheets")}
            >
              <FaClipboardList />
              <span>Admin Timesheets</span>
            </div>
          )}
        </div>
      )}
    </div>


          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;