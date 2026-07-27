import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import './Dashboard.css';

// ── Card accent colours keyed by card type ─────────────────
const CARD_STYLES = {
  projects:   { accent: '#0055ff', iconBg: '#eff6ff', emoji: '📁' },
  features:   { accent: '#0284c7', iconBg: '#e0f2fe', emoji: '🧩' },
  bugs:       { accent: '#000000', iconBg: '#f1f5f9', emoji: '🐛' },
  backlog:    { accent: '#7c3aed', iconBg: '#f5f3ff', emoji: '📋' },
  todo:       { accent: '#ea580c', iconBg: '#fff7ed', emoji: '📝' },
  inProgress: { accent: '#0055ff', iconBg: '#eff6ff', emoji: '🚀' },
  done:       { accent: '#16a34a', iconBg: '#f0fdf4', emoji: '✅' },
};

const PIE_COLORS = ['#0055ff', '#0284c7', '#7c3aed', '#16a34a', '#ea580c', '#dc2626'];
const CHART_COLORS = {
  Backlog:      '#7c3aed',
  'To Do':      '#ea580c',
  'In Progress':'#0055ff',
  Done:         '#16a34a',
};

// ── Helper: get initials from name ─────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

// ── StatCard component ──────────────────────────────────────
const StatCard = ({ cardKey, label, value, sublabel }) => {
  const { accent, iconBg, emoji } = CARD_STYLES[cardKey] || CARD_STYLES.projects;
  return (
    <div
      className="dash-stat-card"
      style={{ '--card-accent': accent, '--card-icon-bg': iconBg }}
    >
      <div className="dash-stat-icon">{emoji}</div>
      <div className="dash-stat-body">
        <div className="dash-stat-value">{value}</div>
        <div className="dash-stat-label">{label}</div>
        {sublabel && <div className="dash-stat-sub">{sublabel}</div>}
      </div>
    </div>
  );
};

// ── Status string helpers ───────────────────────────────────
const getStatusStr = (item) => {
  const obj = item.taskStatus || item.status;
  if (!obj) return '';
  if (typeof obj === 'string') return obj.trim().toLowerCase();
  return (obj.decription || obj.description || obj.name || '').trim().toLowerCase();
};

const getStatusLabel = (item) => {
  const obj = item.taskStatus || item.status;
  if (!obj) return 'Unknown';
  if (typeof obj === 'string') return obj;
  return obj.decription || obj.description || obj.name || 'Unknown';
};

const isActiveSprint = (task) =>
  (task.sprint?.status || '').trim().toLowerCase() === 'active';

const getTaskBucket = (task) => {
  const s = getStatusStr(task);
  
  const hasUser = 
    (task.user && Object.keys(task.user).length > 0) || 
    (task.assignedUser && task.assignedUser.trim() !== "" && task.assignedUser !== "-") ||
    task.assignee || 
    task.assignedTo;

  const isUnassigned = !hasUser;

  // Tasks with explicit 'backlog' status always go to backlog
  if (s.includes('backlog')) return 'backlog';

  // Unassigned tasks (without an explicit non-backlog status) also go to backlog
  if (isUnassigned) return 'backlog';

  if (s === '' || s.includes('todo') || s.includes('to do') || s.includes('open') ||
      s.includes('new') || s.includes('assigned')) return 'todo';
  if (s.includes('in progress') || s.includes('inprogress') || s.includes('progress') ||
      s.includes('working') || s.includes('started')) return 'inProgress';
  if (s.includes('done') || s.includes('completed') || s.includes('closed') ||
      s.includes('resolved') || s.includes('fixed'))
    return isActiveSprint(task) ? 'done' : null;
  return null;
};

const getBadgeClass = (task) => {
  const isAssigned = !!task.user?.id;
  if (!isAssigned) return 'dash-badge-backlog';
  const s = getStatusStr(task);
  if (s.includes('done') || s.includes('completed') || s.includes('closed')) return 'dash-badge-done';
  if (s.includes('progress') || s.includes('active')) return 'dash-badge-inprogress';
  if (s.includes('todo') || s.includes('open') || s.includes('new')) return 'dash-badge-todo';
  return 'dash-badge-default';
};

// ── Custom Tooltip for bar chart ────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b', color: '#fff', padding: '10px 14px',
      borderRadius: 10, fontSize: '0.82rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div>{payload[0].value} task{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
};

// ── Main Dashboard ──────────────────────────────────────────
const Dashboard = () => {
  const [counts, setCounts]           = useState({ projects: 0, features: 0, bugs: 0 });
  const [taskBuckets, setTaskBuckets] = useState({ backlog: 0, todo: 0, inProgress: 0, done: 0 });
  const [pieData, setPieData]         = useState([]);
  const [barData, setBarData]         = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/user/profile', { withCredentials: true });
      const user = profileRes.data;
      setUserProfile(user);
      const isAdmin = user?.role?.description === 'Admin';

      const [projRes, featRes] = await Promise.all([
        api.get('/projects', { withCredentials: true }),
        api.get('/features', { withCredentials: true }),
      ]);

      let allTasks = [];
      let bugsCount = 0;

      if (isAdmin) {
        try {
          const res = await api.get('/view-tasks?page=0&size=1000', { withCredentials: true });
          allTasks = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        } catch (e) { console.error('Admin tasks fetch error:', e); }
        try {
          const bugsRes = await api.get('/view-bugs', { withCredentials: true });
          bugsCount = (bugsRes.data || []).length;
        } catch (e) {}
      } else {
        try {
          const res = await api.get('/user/tasks', { withCredentials: true });
          allTasks = res.data || [];
        } catch (e) {}
        try {
          const bugsRes = await api.get('/user/bugs', { withCredentials: true });
          bugsCount = (bugsRes.data || []).length;
        } catch (e) {}
      }

      setCounts({
        projects: projRes.data.length,
        features: featRes.data.length,
        bugs: bugsCount,
      });

      let backlog = 0, todo = 0, inProgress = 0, done = 0;
      const statusMap = {};

      allTasks.forEach(task => {
        const label = getStatusLabel(task);
        statusMap[label] = (statusMap[label] || 0) + 1;
        const bucket = getTaskBucket(task);
        if (bucket === 'backlog')         backlog++;
        else if (bucket === 'todo')       todo++;
        else if (bucket === 'inProgress') inProgress++;
        else if (bucket === 'done')       done++;
      });

      setPieData(Object.keys(statusMap).map(k => ({ name: k, value: statusMap[k] })));
      setBarData([
        { name: 'Backlog',     count: backlog,    fill: '#7c3aed' },
        { name: 'To Do',       count: todo,       fill: '#ea580c' },
        { name: 'In Progress', count: inProgress, fill: '#0055ff' },
        { name: 'Done',        count: done,       fill: '#16a34a' },
      ]);
      setTaskBuckets({ backlog, todo, inProgress, done });

      const sorted = [...allTasks]
        .sort((a, b) => String(b.createdDate || '').localeCompare(String(a.createdDate || '')))
        .slice(0, 8);
      setRecentTasks(sorted);

    } catch (err) {
      console.error('Dashboard error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const isAdminUser = userProfile?.role?.description === 'Admin';
  const userName    = userProfile?.preffered_name || userProfile?.first_name || 'User';
  const totalTasks  = taskBuckets.backlog + taskBuckets.todo + taskBuckets.inProgress + taskBuckets.done;

  // ── Greeting based on time ────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p style={{ color: '#fff', fontWeight: 600 }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <div className="dash-greeting-tag">
            <span>📊</span> Task Management Dashboard
          </div>
          <h2 className="dash-title">{greeting}, {userName}!</h2>
          <p className="dash-subtitle">
            You have <strong>{totalTasks} tasks</strong> tracked across {counts.projects} project{counts.projects !== 1 ? 's' : ''}.
          </p>
        </div>
        <button className="dash-refresh-btn" onClick={fetchStats}>
          🔄 Refresh
        </button>
      </div>

      {/* ── Overview Cards ─────────────────────────────────── */}
      <div className="dash-section-label">Overview</div>
      <div className="dash-stats-row">
        <StatCard cardKey="projects" label="Projects"  value={counts.projects} />
        <StatCard cardKey="features" label="Features"  value={counts.features} />
        <StatCard
          cardKey="bugs"
          label="Bugs"
          value={counts.bugs}
          sublabel={isAdminUser ? 'Total in system' : 'Assigned to me'}
        />
      </div>

      {/* ── Task Status Cards ───────────────────────────────── */}
      <div className="dash-section-label">Task Status Breakdown</div>
      <div className="dash-stats-row">
        <StatCard cardKey="backlog"    label="Backlog"     value={taskBuckets.backlog}    sublabel="Unassigned tasks" />
        <StatCard cardKey="todo"       label="To Do"       value={taskBuckets.todo}       sublabel="Assigned, not started" />
        <StatCard cardKey="inProgress" label="In Progress" value={taskBuckets.inProgress} sublabel="Currently active" />
        <StatCard cardKey="done"       label="Done"        value={taskBuckets.done}       sublabel="Active sprint only" />
      </div>

      {/* ── Charts ─────────────────────────────────────────── */}
      <div className="dash-section-label dark-label">Analytics</div>
      <div className="dash-charts-row">

        <div className="dash-chart-box">
          <h4 className="dash-chart-title">Task Count by Status</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f0f4ff', radius: 8 }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {barData.map((entry, i) => (
                  <Cell key={`bar-${i}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-chart-box">
          <h4 className="dash-chart-title">Tasks by Status (All)</h4>
          {pieData.length === 0 ? (
            <div className="dash-no-data">
              <span style={{ fontSize: '2rem' }}>📭</span>
              <p>No task data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={88}
                  innerRadius={44}
                  paddingAngle={3}
                  label={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={`pie-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b', border: 'none', borderRadius: 10,
                    color: '#fff', fontSize: '0.82rem', padding: '10px 14px',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.78rem', fontFamily: 'Inter', paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ── Recent Tasks Table ──────────────────────────────── */}
      {recentTasks.length > 0 && (
        <>
          <div className="dash-section-label dark-label">Recent Tasks</div>
          <div className="dash-table-box">
            <div className="dash-table-header">
              <h4>Latest Activity</h4>
              <span className="dash-table-count">{recentTasks.length} tasks</span>
            </div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Sprint</th>
                  <th>Sprint Status</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map(task => {
                  const statusLabel = getStatusLabel(task);
                  const badgeClass  = getBadgeClass(task);
                  const isAssigned  = !!task.user?.id;
                  const sprintSt    = (task.sprint?.status || '').trim();
                  const assigneeName = task.user?.preffered_name || task.user?.first_name || task.user?.name || task.user?.username;

                  let sprintBadgeClass = 'dash-badge-default';
                  if (sprintSt.toLowerCase() === 'active') sprintBadgeClass = 'dash-badge-inprogress';
                  else if (['completed','closed'].includes(sprintSt.toLowerCase())) sprintBadgeClass = 'dash-badge-done';

                  return (
                    <tr key={task.id}>
                      <td><span className="dash-task-id">#{task.id}</span></td>
                      <td className="dash-task-title" title={task.userstory || task.description || ''}>
                        {task.userstory || task.description || '—'}
                      </td>
                      <td>
                        {isAssigned ? (
                          <div className="dash-assignee">
                            <div className="dash-avatar">{getInitials(assigneeName)}</div>
                            <span>{assigneeName || '—'}</span>
                          </div>
                        ) : (
                          <span className="dash-badge dash-badge-backlog">Unassigned</span>
                        )}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.82rem' }}>{task.sprint?.name || '—'}</td>
                      <td>
                        {task.sprint
                          ? <span className={`dash-badge ${sprintBadgeClass}`}>{sprintSt || '—'}</span>
                          : <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                      </td>
                      <td>
                        <span className={`dash-badge ${badgeClass}`}>
                          {!isAssigned ? 'Backlog' : statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;
