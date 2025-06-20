import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Home from './Register_and_login/Home';
//import Tasks from './Pages/Tasks';
import Profile from './Pages/Profile';
import LoginForm from './Register_and_login/LoginForm';
import RegisterForm from './Register_and_login/RegisterForm';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      {isLoggedIn ? (
  <>
    <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
    <Navbar collapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(prev => !prev)} />
    <div className={`home-container ${sidebarCollapsed ? 'full' : ''}`}>
      <Routes>
        <Route path="/home" element={<Home />} />
        {/* <Route path="/tasks" element={<Tasks />} /> */}
        <Route path="/profile" element={<Profile />} />
        {/* ... other private routes */}
      </Routes>
    </div>
  </>
) :
 (
  <Routes>
    <Route path="/" element={<LoginForm onLogin={() => setIsLoggedIn(true)} />} />
    <Route path="/register" element={<RegisterForm />} />
  </Routes>
)
}


      <div className={`home-container ${sidebarCollapsed ? 'full' : ''}`}>
        <Routes>
          <Route path="/" element={<LoginForm onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/home" element={isLoggedIn ? <Home /> : <Navigate to="/" />} />
          {/* <Route path="/tasks" element={isLoggedIn ? <Tasks /> : <Navigate to="/" />} /> */}
          <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
