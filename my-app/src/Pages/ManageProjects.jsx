// src/Pages/ManageProjects.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './ManageProject.css';
import { FaEye, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    axios.get('http://localhost:8080/api/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Error fetching projects:', err));
  };

  const deleteProject = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      axios.delete(`http://localhost:8080/api/projects/${id}`)
        .then(() => fetchProjects())
        .catch(err => console.error('Error deleting project:', err));
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-project/${id}`);
    axios.put(`http://localhost:8080/api/projects/${id}`)
  };

  const handleView = (project) => {
    alert(`Viewing Project:\nID: ${project.id}\nName: ${project.name}\nDescription: ${project.description}`);
  };

  const handleStatusChange = (id, newStatus) => {
    axios.patch(`http://localhost:8080/api/projects/${id}`, { status: newStatus })
      .then(() => fetchProjects())
      .catch(err => console.error('Failed to update status:', err));
  };

  const filteredProjects = projects.filter(project =>
    (project.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     project.id?.toString() === searchTerm.trim())
  );

  return (
    <div className="manage-projects-page">
      <div className="manage-main">
        <Navbar />
        <div className="manage-container">
          <h1 className="manage-title">Manage Projects</h1>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name or ID"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn" onClick={fetchProjects}>Search</button>
          </div>

          <div className="project-grid">
            {filteredProjects.map(project => (
              <div className="project-card" key={project.id}>
                <h3>ID: {project.id}</h3>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <span className={`status-tag ${project.status?.toLowerCase() || 'inprogress'}`}>
                  {project.status || 'In Progress'}
                </span>
                <select
                  className="status-select"
                  value={project.status || 'In Progress'}
                  onChange={(e) => handleStatusChange(project.id, e.target.value)}
                >
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
                <div className="project-actions">
                  <button className="view-btn" onClick={() => handleView(project)}><FaEye /></button>
                  <button className="edit-btn" onClick={() => handleEdit(project.id)}><FaEdit /> Edit</button>
                  <button className="delete-btn" onClick={() => deleteProject(project.id)}>Delete</button>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && <p>No projects found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
