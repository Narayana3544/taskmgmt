import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './Register_and_login/Home';
import Profile from './Pages/Profile';
import LoginForm from './Register_and_login/LoginForm';
import RegisterForm from './Register_and_login/RegisterForm';
import Project from './Pages/Project';
import CreateProject from './Pages/CreateProject';
import ManageProjects from './Pages/ManageProjects';
import EditProject from './Pages/EditProject';
import Features from './Features/Features';
import FeatureList from './Features/FeatureList';
import UserStories from './userstories/UserStories';
import ViewUserStories from './userstories/ViewUserStories';
import Dashboard from './dashboard/Dashboard';
import CreateSprint from './sprint/CreateSprint';
import AssignUsersToSprint from './sprint/AssignUsers';
import ManageSprints from './sprint/ManageSprints';
import AssignTasksToSprint from './sprint/AssignTasksToSprint';
import SprintOverview from './sprint/SprintOverview';
import AssignedStories from './dashboard/AssignedTasks';
import EditUserStory from './userstories/EdituserStories';
import EditFeature from './Features/EditFeature';
import TaskForm from './Task/CreateTask';
import TaskList from './Task/TaskList';
import TaskDetails from './Task/TaskDetails';
import EditTask from './Task/EditTask';
import ViewProject from './Pages/ViewProject';
import ViewProjectById from './Project/AssignedProjects'
import ViewFeaturesByProjectId from './Features/ViewFeaturesByProjectId'
import ViewSprintsByFeatureid from './sprint/ViewSprintsByFeatureId';
import ActiveSprints from './Project/ActiveSprints';
import TimesheetForm from './TimeSheets/TimeSheetForm';
import BugForm from './Bugs/Bugform';
import BugList from './Bugs/BugList';
import BugDetails from './Bugs/BugDetails';
import DailyTimesheet from './DailyTimesheets/DailyTimeSheet';
import MonthlyTimesheet from './DailyTimesheets/UserRangeTimeSheet';
import AdminRangeTimeSheet from './DailyTimesheets/AdminRangeTimeSheet';
import TimesheetExcelExport from './DailyTimesheets/TimesheetExcelExport';
import { ToastContainer } from "react-toastify";
import EditSprint from './sprint/EditSprint';
import TimesheetSummary from './DailyTimesheets/AllTimesheetSummary';
import AdminAllTimesheets from './DailyTimesheets/AdminAllTimesheets';
import EditAnyTimesheet from './DailyTimesheets/EditTimesheets';
import GlassDashboard from './dashboard/GlassDashboard';
import AdminRoles from './Pages/AdminRoles';
import AdminUsers from './Pages/AdminUsers';

// 🔹 Small component for logout route
const Logout = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    onLogout();
    navigate("/"); // redirect to login after logout
  }, [onLogout, navigate]);

  return null; // nothing to render
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("user") ? true : false;
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  return (
    <Router>
      {isLoggedIn ? (
        <Layout>
          <Routes>
            {/* Redirect root to Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Main Dashboard - Swapped to GlassDashboard */}
            <Route path="/dashboard" element={<GlassDashboard />} />
            <Route path="/home" element={<Home />} /> {/* Keep legacy home available if needed */}

            {/* Admin Routes */}
            <Route path="/admin/roles" element={<AdminRoles />} />

            {/* Existing Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/project" element={<Project />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/manage-projects" element={<ManageProjects />} />
            <Route path="/features" element={<Features />} />
            <Route path="/projects/:projectId/features" element={<Features />} />
            <Route path="/features/:projectId" element={<FeatureList />} />
            <Route path="/view-features" element={<FeatureList />} />
            <Route path="/userstories" element={<UserStories />} />
            <Route path="/view-stories" element={<ViewUserStories />} />
            <Route path="/create-sprint" element={<CreateSprint />} />
            <Route path="/manage-sprints" element={<ManageSprints />} />
            <Route path="/sprint/:sprintId/assign-users" element={<AssignUsersToSprint />} />
            <Route path="/sprints/:sprintId/assign-stories/:featureId" element={<AssignTasksToSprint />} />
            <Route path="/sprints/overview/:sprintId" element={<SprintOverview />} />
            <Route path="/my-stories" element={<AssignedStories />} />
            <Route path="/edit-project/:id" element={<EditProject />} />
            <Route path="/edit-userstory/:id" element={<EditUserStory />} />
            <Route path="/edit-feature/:id" element={<EditFeature />} />
            <Route path="/create-task" element={<TaskForm />} />
            <Route path="/task" element={<TaskList />} />
            <Route path="/task/:id" element={<TaskDetails />} />
            <Route path="/edit-task/:id" element={<EditTask />} />
            <Route path="/view-project/:id" element={<ViewProject />} />
            <Route path="/view-projectsByUserId" element={<ViewProjectById />} />
            <Route path="/view-featuresByprojectid/:projectId" element={<ViewFeaturesByProjectId />} />
            <Route path="/ViewSprintsByFeatureid/:featureId" element={<ViewSprintsByFeatureid />} />
            <Route path="/active-sprints" element={<ActiveSprints />} />
            <Route path="/time-sheets" element={<TimesheetForm />} />
            <Route path="/task/:id/buglist" element={<BugList />} />
            <Route path="/task/:id/bug" element={<BugForm />} />
            <Route path="/bug/:id" element={<BugDetails />} />
            <Route path="/Monthly-time-sheets" element={<MonthlyTimesheet />} />
            <Route path="/timesheet/:date" element={<DailyTimesheet />} />
            <Route path="/admin/timesheets" element={<AdminRangeTimeSheet />} />
            <Route path="/timesheet-export" element={<TimesheetExcelExport />} />
            <Route path="/edit-sprint/:id" element={<EditSprint />} />
            <Route path="/timesheet-summary" element={<TimesheetSummary />} />
            <Route path="/admin/timesheet-export" element={<TimesheetExcelExport />} />
            <Route path="/admin/timesheet" element={<AdminAllTimesheets />} />
            <Route path="/edit-sprint/:id" element={<EditSprint />} />
            <Route path="/timesheet/edit/:userId/:date" element={<EditAnyTimesheet />} />
            {/* 🔹 Logout Route */}
            <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/" element={<LoginForm onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </Router>
  );
}

export default App;