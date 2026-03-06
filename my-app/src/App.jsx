import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import KanbanBoard from './pages/KanbanBoard';
import Projects from './pages/Projects';
import WorkItems from './pages/WorkItems';
import WorkItemDetail from './pages/WorkItemDetail';
import Sprints from './pages/Sprints';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected pages */}
        <Route path="/" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/work-items" element={<ProtectedRoute><WorkItems /></ProtectedRoute>} />
        <Route path="/work-items/:id" element={<ProtectedRoute><WorkItemDetail /></ProtectedRoute>} />
        <Route path="/sprints" element={<ProtectedRoute><Sprints /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;