// src/Pages/Project.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // ✅ import axios
import Navbar from '../components/Navbar';
import './Project.css';

export default function Project() {
  const [showForm, setShowForm] = useState(false);
  const [project, setProject] = useState({ name: '', description: '' });
 const [projects, setProjects] = useState([]);

  // ✅ Fetch all projects from backend
  useEffect(() => {
    axios.get('http://localhost:8080/api/projects')
      .then((res) => {
        setProjects(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch projects:', err);
      });
  }, []);
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (project.description.length < 0 || project.description.length > 250) {
      alert('Description must be between 0 and 250 characters.');
      return;
    }

    try {
      // ✅ Update this URL to match your Spring Boot endpoint
      const response = await axios.post(
  'http://localhost:8080/api/addproject',
  project,
  { headers: { 'Content-Type': 'application/json' } }
);
      

      console.log('✅ Project submitted:', response.data);
      alert('Project created successfully!');
      setShowForm(false);
      setProject({ name: '', description: '' }); // Reset form
    } catch (error) {
      console.error('❌ Error submitting project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  return (
    <div className="project-page">
      <div className="project-main">
        <Navbar />
        <div className="project-container">
          <div className="project-header">
            <h1>Projects</h1>
            <button
              onClick={() => setShowForm(true)}
              className="project-btn"
            >
              Add Project
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="project-form">
              <label>Project Name</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                required
              />

              <label>Description</label>
              <textarea
                value={project.description}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                required
                maxLength={250}
              />
              <div className="char-count">{project.description.length} / 250</div>

              <button type="submit" className="submit-btn">
                Submit
              </button>
            </form>

          )}
           <div className="project-list">
            {projects.map((p) => (
              <div className="project-card" key={p.id}>
                <h3>Project Id:{p.id}</h3>
                <h3>Project Name:{p.name}</h3>
                <p>Project description:{p.description}</p>
              </div>
            ))}
            {projects.length === 0 && <p>No projects found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
