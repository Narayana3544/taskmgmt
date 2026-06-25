import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';

// Existing pages (kept in /pages — they use the old Layout wrapper)
import KanbanBoard from './pages/KanbanBoard';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Features from './pages/Features';
import WorkItems from './pages/WorkItems';
import Sprints from './pages/Sprints';

// Features — Enhanced detail pages
import WorkItemDetails from './features/workitems/WorkItemDetails';
import SprintDetails from './features/sprints/SprintDetails';
import SprintDashboard from './features/sprints/SprintDashboard';
import SprintPlanning from './features/sprints/SprintPlanning';
import ProjectDashboard from './features/projects/ProjectDashboard';
import FeatureDetails from './features/features/FeatureDetails';

// Features — Holidays
import Holidays from './features/holidays/Holidays';
import HolidayCalendar from './features/holidays/HolidayCalendar';
import HolidayDetails from './features/holidays/HolidayDetails';

// Features — Leaves
import LeaveManagement from './features/leaves/LeaveManagement';
import LeaveDetails from './features/leaves/LeaveDetails';

// Features — Timesheets
import MyTimesheets from './features/timesheets/MyTimesheets';
import TimesheetApproval from './features/timesheets/TimesheetApproval';
import TimesheetDetails from './features/timesheets/TimesheetDetails';
import TimesheetOverview from './features/reports/TimesheetOverview';
import UserTimesheetDetails from './features/reports/UserTimesheetDetails';
import DailyTimesheetLogs from './features/reports/DailyTimesheetLogs';

// Features — Master Data & Organization
import MasterData from './features/masterdata/MasterData';
import OrganizationSettings from './features/organization/OrganizationSettings';

// Features — Users
import UserManagement from './features/users/UserManagement';
import UserProfile from './features/users/UserProfile';
import UserActivity from './features/users/UserActivity';

// Features — Notifications
import Notifications from './features/notifications/Notifications';

// Features — Audit & Activity
import AuditLog from './features/audit/AuditLog';
import ActivityFeed from './features/activity/ActivityFeed';

// Features — Profile & Roles
import Profile from './features/profile/Profile';
import RolePermissions from './features/roles/RolePermissions';
import MyPerformance from './features/performance/MyPerformance';
import ManagerReview from './features/performance/ManagerReview';

const routerBasename = process.env.PUBLIC_URL || '';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Prevent users who need password change from accessing anything else
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.requiresPasswordChange && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
      }
    } catch (e) { }
  }

  return children;
};

function App() {

  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: "'Inter', sans-serif" } }} />
      <BrowserRouter basename={routerBasename}>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

          {/* Main */}
          <Route path="/" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/:id/dashboard" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
          <Route path="/work-items" element={<ProtectedRoute><WorkItems /></ProtectedRoute>} />
          <Route path="/work-items/:id" element={<ProtectedRoute><WorkItemDetails /></ProtectedRoute>} />
          <Route path="/sprints" element={<ProtectedRoute><Sprints /></ProtectedRoute>} />
          <Route path="/sprints/:id" element={<ProtectedRoute><SprintDetails /></ProtectedRoute>} />
          <Route path="/sprints/:id/dashboard" element={<ProtectedRoute><SprintDashboard /></ProtectedRoute>} />
          <Route path="/sprints/:id/planning" element={<ProtectedRoute><SprintPlanning /></ProtectedRoute>} />
          <Route path="/features" element={<ProtectedRoute><Features /></ProtectedRoute>} />
          <Route path="/features/:id" element={<ProtectedRoute><FeatureDetails /></ProtectedRoute>} />

          {/* HR */}
          <Route path="/leaves" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
          <Route path="/leaves/:id" element={<ProtectedRoute><LeaveDetails /></ProtectedRoute>} />
          <Route path="/timesheets" element={<ProtectedRoute><MyTimesheets /></ProtectedRoute>} />
          <Route path="/timesheets/approvals" element={<ProtectedRoute><TimesheetApproval /></ProtectedRoute>} />
          <Route path="/timesheets/report" element={<ProtectedRoute><TimesheetOverview /></ProtectedRoute>} />
          <Route path="/timesheets/report/user/:userId" element={<ProtectedRoute><UserTimesheetDetails /></ProtectedRoute>} />
          <Route path="/timesheets/report/details/:timesheetId" element={<ProtectedRoute><DailyTimesheetLogs /></ProtectedRoute>} />
          <Route path="/timesheets/:id" element={<ProtectedRoute><TimesheetDetails /></ProtectedRoute>} />
          <Route path="/holidays" element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
          <Route path="/holidays/calendar" element={<ProtectedRoute><HolidayCalendar /></ProtectedRoute>} />
          <Route path="/holidays/:id" element={<ProtectedRoute><HolidayDetails /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/master-data" element={<ProtectedRoute><MasterData /></ProtectedRoute>} />
          <Route path="/organization" element={<ProtectedRoute><OrganizationSettings /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/users/:id/activity" element={<ProtectedRoute><UserActivity /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><RolePermissions /></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* Personal */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityFeed /></ProtectedRoute>} />
          <Route path="/performance" element={<ProtectedRoute><MyPerformance /></ProtectedRoute>} />
          <Route path="/performance/review" element={<ProtectedRoute><ManagerReview /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
