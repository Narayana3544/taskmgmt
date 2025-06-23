import React, { useState } from 'react';
import axios from 'axios';
// import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './CreateProject.css'; // You'll get this next

export default function CreateProject() {
  const [project, setProject] = useState({ name: '', description: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description } = project;

    if (description.length < 250 || description.length > 300) {
      setErrorMessage('Description must be between 250 and 300 characters.');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/addproject', project);
      setSuccessMessage('✅ Project created successfully!');
      setErrorMessage('');
      setProject({ name: '', description: '' });
    } catch (err) {
      console.error('Error creating project:', err);
      setErrorMessage('❌ Failed to create project.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="create-project-page">
      {/* <Sidebar /> */}
      <div className="create-main">
        <Navbar />
        <div className="create-container">
          <h1 className="create-title">Create New Project</h1>

          {successMessage && <div className="success-msg">{successMessage}</div>}
          {errorMessage && <div className="error-msg">{errorMessage}</div>}

          <form className="create-form" onSubmit={handleSubmit}>
            <label>Project Name</label>
            <input
              type="text"
              value={project.name}
              placeholder='Project Name'
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              required
            />

            <label>Description (250–300 characters)</label>
            <textarea
              value={project.description}
              placeholder='Description'
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              required
              maxLength={300}
            />
            <div className="char-count">{project.description.length} / 300</div>

            <button type="submit" className="submit-btn">Create Project</button>
          </form>
        </div>
      </div>
    </div>
  );
}
