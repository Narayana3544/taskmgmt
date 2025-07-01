// src/Pages/EditProject.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './EditProject.css';

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState({ name: '', description: '', status: 'In Progress' });

  useEffect(() => {
    axios.get(`http://localhost:8080/api/projects/${id}`)
      .then(res => setProject(res.data))
      .catch(err => console.error('Failed to load project:', err));
  }, [id]);

  const handleChange = (e) => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.patch(`http://localhost:8080/api/projects/${id}`, project)
      .then(() => {
        alert('Project updated successfully!');
        navigate('/manage-projects');
      })
      .catch(err => console.error('Failed to update project:', err));
  };

  return (
    <div className="edit-project-page">
      <div className="edit-main">
        <Navbar />
        <div className="edit-container">
          <h1>Edit Project</h1>
          <form onSubmit={handleSubmit} className="edit-form">
            <label>Project Name</label>
            <input
              type="text"
              name="name"
              placeholder='Project Name'
              value={project.name}
              onChange={handleChange}
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              placeholder='Description'
              value={project.description}
              onChange={handleChange}
              required
              maxLength={300}
            />
            <div className="char-count">{project.description.length} / 300</div>

            <label>Status</label>
            <select name="status" value={project.status} onChange={handleChange}>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Pending</option>
            </select>

            <button type="submit" className="update-btn">Update</button>
          </form>
        </div>
      </div>
    </div>
  );
}
