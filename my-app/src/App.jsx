import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
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
import AssignedStories from './dashboard/AssignedStories';
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
    {isLoggedIn ? (
      <>
        <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
        <Navbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
        />
        <div className={`home-container ${sidebarCollapsed ? 'full' : ''}`}>
          <Routes>
                <Route path="/home" element={<Home />} />
                {/* <Route path="/tasks" element={<Tasks />} /> */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/project" element={<Project />} />
                {/* <Route path="/features" element={<FeaturesPage />} /> ✅ new route */}
                {/* <Route path="*" element={<Navigate to="/home" />} /> */}
                <Route path="/create-project" element={<CreateProject />} />    
                <Route path="/manage-projects" element={<ManageProjects />} />
                <Route path="/features" element={<Features />} />
                <Route path="/projects/:projectId/features" element={<Features />} />
                <Route path="/features/:projectId" element={<FeatureList />} />
                <Route path="/view-features" element={<FeatureList />} />
                <Route path="/userstories" element={<UserStories />} />
                <Route path="/view-stories" element={<ViewUserStories />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-sprint" element={<CreateSprint />} />
                {/* <Route path="/assign-sprint-users" element={<AssignUsersToSprint />} /> */}
                <Route path="/manage-sprints" element={<ManageSprints />} />
                <Route path="/sprint/:sprintId/assign-users" element={<AssignUsersToSprint />} />
                <Route path="/sprints/:sprintId/assign-stories/:featureId" element={<AssignTasksToSprint />} />
                <Route path="/sprints/:id/overview" element={<SprintOverview />} />
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
          </Routes>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/" element={<LoginForm onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
