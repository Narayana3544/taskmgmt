import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [counts, setCounts] = useState({ projects: 0, features: 0 });
  const [taskBuckets, setTaskBuckets] = useState({ backlog: 0, todo: 0, inProgress: 0, done: 0 });
  const [statusData, setStatusData] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 1️⃣ Get logged-in user profile
      const profileRes = await api.get('/user/profile', { withCredentials: true });
      const user = profileRes.data;
      setUserProfile(user);
      const isAdmin = user?.role?.description === "Admin";

      // 2️⃣ Fetch projects and features count
      const [projRes, featRes] = await Promise.all([
        api.get('/projects', { withCredentials: true }),
        api.get('/features', { withCredentials: true }),
      ]);
      setCounts({
        projects: projRes.data.length,
        features: featRes.data.length
      });

      // 3️⃣ Backlog: Admin only — all unassigned tasks from the system
      let backlog = 0;
      if (isAdmin) {
        try {
          const [allTasksRes, allBugsRes] = await Promise.all([
            api.get('/view-tasks', { withCredentials: true }),
            api.get('/view-bugs', { withCredentials: true }),
          ]);
          const allUnassigned = [
            ...allTasksRes.data.filter(t => !t.user?.id),
            ...allBugsRes.data.filter(b => !b.assignedUser?.id),
          ];
          backlog = allUnassigned.length;
        } catch (e) {
          console.error('Error fetching backlog:', e);
        }
      }

      // 4️⃣ To Do, In Progress, Done: logged-in user's tasks & bugs only
      const [myTasksRes, myBugsRes] = await Promise.all([
        api.get('/user/tasks', { withCredentials: true }),
        api.get('/user/bugs', { withCredentials: true }),
      ]);

      const myTasks = myTasksRes.data || [];
      const myBugs = (myBugsRes.data || []).map(b => ({
        ...b,
        taskStatus: b.status,
      }));
      const myAll = [...myTasks, ...myBugs];

      let todo = 0;
      let inProgress = 0;
      let done = 0;
      const statusMap = {};

      myAll.forEach(task => {
        // Build pie chart data from user's tasks
        const statusLabel =
          task.taskStatus?.decription ||
          task.taskStatus?.description ||
          task.status?.decription ||
          task.status?.description ||
          (typeof task.status === 'string' ? task.status : 'Unknown');
        statusMap[statusLabel] = (statusMap[statusLabel] || 0) + 1;

        // Normalise status string
        let statusStr = '';
        const statusObj = task.taskStatus || task.status;
        if (typeof statusObj === 'string') {
          statusStr = statusObj;
        } else if (statusObj) {
          statusStr = statusObj.decription || statusObj.description || statusObj.name || '';
        }
        statusStr = statusStr.trim().toLowerCase();

        const sprintStatus = (task.sprint?.status || '').toLowerCase();
        const isActiveSprint = sprintStatus === 'active';

        if (
          statusStr.includes('todo') ||
          statusStr.includes('open') ||
          statusStr.includes('new') ||
          statusStr.includes('assigned') ||
          statusStr === ''
        ) {
          todo++;
        } else if (
          statusStr.includes('progress') ||
          statusStr.includes('working') ||
          statusStr === 'active'
        ) {
          inProgress++;
        } else if (
          statusStr.includes('done') ||
          statusStr.includes('completed') ||
          statusStr.includes('closed') ||
          statusStr.includes('resolved')
        ) {
          // Done counts only tasks in an Active Sprint
          if (isActiveSprint) {
            done++;
          }
        }
      });

      const statusArray = Object.keys(statusMap).map(key => ({
        name: key,
        value: statusMap[key],
      }));

      setStatusData(statusArray);
      setTaskBuckets({ backlog, todo, inProgress, done });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const isAdmin = userProfile?.role?.description === "Admin";

  return (
    <div className="dashboard-container">
      <h2>📊 Dashboard Overview</h2>

      {/* ✅ Summary Count Cards — Task counts only, no story points */}
      <div className="card-stats" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ flex: 1, minWidth: '150px', background: '#e0e7ff', padding: '15px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4338ca' }}>📁 Projects</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#312e81' }}>{counts.projects}</p>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: '150px', background: '#dcfce7', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#15803d' }}>🧩 Features</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>{counts.features}</p>
        </div>

        {/* Backlog: Admin only */}
        {isAdmin && (
          <div className="stat-card" style={{ flex: 1, minWidth: '150px', background: '#fce7f3', padding: '15px', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#be185d' }}>📋 Backlog</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9d174d' }}>{taskBuckets.backlog}</p>
            <span style={{ fontSize: '11px', color: '#9d174d' }}>Unassigned tasks</span>
          </div>
        )}

        <div className="stat-card" style={{ flex: 1, minWidth: '150px', background: '#ffedd5', padding: '15px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#c2410c' }}>📝 To Do</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9a3412' }}>{taskBuckets.todo}</p>
          <span style={{ fontSize: '11px', color: '#9a3412' }}>My tasks</span>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: '150px', background: '#dbeafe', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1d4ed8' }}>🚀 In Progress</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>{taskBuckets.inProgress}</p>
          <span style={{ fontSize: '11px', color: '#1e3a8a' }}>My tasks</span>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: '150px', background: '#d1fae5', padding: '15px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#047857' }}>✅ Done</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#064e3b' }}>{taskBuckets.done}</p>
          <span style={{ fontSize: '11px', color: '#064e3b' }}>Active sprint only</span>
        </div>
      </div>

      {/* ✅ Charts */}
      <div className="charts-row" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div className="chart-box" style={{ flex: 1, minWidth: '300px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>My Task Status (Pie)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" label>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box" style={{ flex: 1, minWidth: '300px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Entities Overview (Bar)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[counts]}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="projects" fill="#8884d8" />
              <Bar dataKey="features" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
