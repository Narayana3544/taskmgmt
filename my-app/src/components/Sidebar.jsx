import React, { useState ,useEffect} from 'react';
import api from '../api';
import './Sidebar.css';
import {
  FaClipboardList, FaChevronDown, FaChevronUp ,
  FaUserCircle, FaPlusCircle, FaChartBar, FaCog,
  FaRegCalendarAlt, FaFileInvoiceDollar, FaBars, FaUser, FaThList, FaSignOutAlt
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
        <div className="sidebar-top-nav">
          <div className="nav-section">
            <div className="nav-item" title="Dashboard" onClick={() => navigate('/home')}><FaThList /> <span>Dashboard</span></div>
            <div className="nav-item" title="My Tasks" onClick={() => navigate('/my-stories')}><FaChartBar /><span>My Tasks</span></div>
            <div className="nav-item" title="Task" onClick={() => navigate('/task')}>
                <FaChartBar /><span>Task</span>
              </div>
            <div className="nav-item" title="Bugs" onClick={() => navigate('/bugs')}>
                <FaChartBar /><span>Bugs</span>
              </div>

            {user.role?.description === "Admin" && (
            <div className="nav-item" title="Projects" onClick={() => navigate('/manage-projects')}>
              <FaFileInvoiceDollar /><span>Projects</span>
              </div>
              )}
              {user.role?.description === "Admin" && (
                <div className="nav-item" title="Features" onClick={() => navigate('/view-features')}>
              <FaFileInvoiceDollar /><span>Features</span>
              </div>
            )}

                 {user.role?.description === "Admin" && (
                <div className="nav-item" title="Sprints" onClick={() => navigate('/manage-sprints')}>
                  <FaChartBar /><span>Sprints</span>
                </div>
              )}



              {/* <div className="nav-item" title="Sprints" onClick={() => navigate('/manage-sprints')}>
                <FaChartBar /><span>Sprints</span>
              </div> */}
              
              
              {/* <div className="nav-item" title="Profile" onClick={() => navigate('/profile')}><FaUser /><span>Profile</span></div> */}
               {/* <div className="nav-item" title="My Projects" onClick={() => navigate('/view-projectsByUserId')}><FaUser /><span>My Projects</span></div> */}
              <div className="nav-item" title="Sprint Tasks" onClick={() => navigate('/active-sprints')}>
                <FaChartBar /><span>Sprint Tasks</span>
              </div>
        <div
          className="nav-item "
          title="Timesheets"
          onClick={() => setTimeSheetOpen(!timeSheetOpen)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaRegCalendarAlt />
            <span>Timesheets</span>
          </div>
          {timeSheetOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>

        {/* Sub-navigation */}
        {timeSheetOpen && (
          <div className="sub-nav" style={{ paddingLeft: "20px", marginTop: "5px" }}>
            <div
              className="nav-item"
              title="Create Timesheet"
              onClick={() => navigate(`/timesheet/${today}`)}
            >
              <FaRegCalendarAlt />
              <span>create</span>
            </div>
            <div
              className="nav-item"
              title="Search Timesheets"
              onClick={() => navigate("/Monthly-time-sheets")}
            >
              <FaUser />
              <span>search</span>
            </div>
            {/* {user.role?.description === "Admin" && (
              <div
                className="nav-item"
                onClick={() => navigate("/admin/timesheets")}
              >
                <FaClipboardList />
                <span>Admin Timesheet</span>
              </div>
            )} */}
          </div>
        )}
        
        {user.role?.description === "Admin" && (
          <div
            className="nav-item"
            title="All Timesheets"
            onClick={() => navigate("/admin/timesheet")}
          >
            <FaClipboardList />
            <span>All Timesheets</span>
          </div>
        )}

      </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;