import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterForm from './Register_and_login/RegisterForm';
import LoginForm from './Register_and_login/LoginForm';
import Home from './Register_and_login/Home';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={showLogin ? (
            <LoginForm onToggle={() => setShowLogin(false)} />
          ) : (
            <RegisterForm onToggle={() => setShowLogin(true)} />
          )}
        />
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
