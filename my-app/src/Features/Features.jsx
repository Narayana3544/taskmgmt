import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Features.css';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [feature, setFeature] = useState({
    name: '',
    descriptor: '',
    status: 'In Progress'
  });

  const navigate = useNavigate(); // ✅ Add navigation hook

  useEffect(() => {
    axios.get('http://localhost:8080/api/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Error fetching projects:', err));
  }, []);

  const handleProjectSelect = (e) => {
    const id = e.target.value;
    setSelectedProjectId(id);
    const project = projects.find(p => p.id.toString() === id);
    setSelectedProjectName(project?.name || '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeature(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select a project first.');
      return;
    }

    axios.post(`http://localhost:8080/api/projects/${selectedProjectId}/addfeature`, feature)
      .then(() => {
        alert('Feature added successfully!');
        navigate(`/features/${selectedProjectId}`); // ✅ Redirect to feature list for this project
      })
      .catch(err => {
        console.error('Failed to save feature:', err);
        alert('Error saving feature.');
      });
  };

  return (
    <div className="features-page">
      <h2 className="features-header">Add Feature</h2>

      <form onSubmit={handleSubmit} className="feature-form">
        <div className="form-group">
          <label>Select Project</label>
          <select value={selectedProjectId} onChange={handleProjectSelect}>
            <option value="">-- Select a project --</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProjectId && (
          <>
            <div className="project-details">
              <strong>Project:</strong> {selectedProjectName} (ID: {selectedProjectId})
            </div>

            <div className="form-group">
              <label>Feature name</label>
              <input name="name" value={feature.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea name="descriptor" value={feature.descriptor} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={feature.status} onChange={handleChange}>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">Add Feature</button>
          </>
        )}
      </form>
    </div>
  );
};

export default Features;
