import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Home from './Register_and_login/Home';
// import Tasks from './Pages/Tasks';
import Profile from './Pages/Profile';
import LoginForm from './Register_and_login/LoginForm';
import RegisterForm from './Register_and_login/RegisterForm';
import Project from './Pages/Project';
  import CreateProject from './Pages/CreateProject';
import ManageProjects from './Pages/ManageProjects';
import EditProject from './Pages/EditProject';
import Features from './Features/Features';
import FeatureList from './Features/FeatureList';
import ViewFeaturesPage from './Features/ViewFeaturesPage';
import UserStories from './userstories/UserStories';

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
  <Route path="/view-features" element={<ViewFeaturesPage />} />
<Route path="/userstories" element={<UserStories />} />


<Route path="/edit-project/:id" element={<EditProject />} />

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
