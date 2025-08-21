import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [counts, setCounts] = useState({ projects: 0, features: 0, stories: 0 });
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [projRes, featRes, storyRes] = await Promise.all([
        axios.get('http://localhost:8080/api/projects', { withCredentials: true }),
        axios.get('http://localhost:8080/api/features', { withCredentials: true }),
        axios.get('http://localhost:8080/api/view-tasks', { withCredentials: true })
      ]);

      setCounts({
        projects: projRes.data.length,
        features: featRes.data.length,
        stories: storyRes.data.length
      });

      const statusMap = {};
      storyRes.data.forEach(s => {
        const status = s.status || 'Unknown';
        statusMap[status] = (statusMap[status] || 0) + 1;
      });

      const statusArray = Object.keys(statusMap).map(key => ({
        name: key,
        value: statusMap[key]
      }));

      setStatusData(statusArray);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="dashboard-container">
      <h2>📊 Dashboard Overview</h2>

      <div className="card-stats">
        <div className="stat-card">📁 Projects: {counts.projects}</div>
        <div className="stat-card">🧩 Features: {counts.features}</div>
        <div className="stat-card">📝 Stories: {counts.stories}</div>
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h4>User Story Status (Pie)</h4>
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

        <div className="chart-box">
          <h4>Entities Overview (Bar)</h4>
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
              <Bar dataKey="stories" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
