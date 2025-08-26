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
    description: '',
   status: "",
  });
    const [statuses, setStatuses] = useState([]);

    useEffect(() => {
    axios
      .get("http://localhost:8080/api/getstatusForFeature", { withCredentials: true })
      .then((res) => setStatuses(res.data))
      .catch((err) => console.error("Error fetching statuses:", err));
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:8080/api/projects', { withCredentials: true })
      .then((res) => setProjects(res.data))
      .catch((err) => console.error('Error fetching projects:', err));
  }, []);

  const handleProjectSelect = (e) => {
    const id = e.target.value;
    setSelectedProjectId(id);
    const project = projects.find((p) => p.id.toString() === id);
    setSelectedProjectName(project?.name || '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
     if (name === "status") {
    setFeature((prev) => ({ ...prev, status: { id: value } }));
  } else {
    setFeature((prev) => ({ ...prev, [name]: value }));
  }
};
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select a project first.');
      return;
    }

    console.log('Submitting feature:', feature); // Debug log

    axios
      .post(`http://localhost:8080/api/projects/${selectedProjectId}/addfeature`, feature, {
        withCredentials: true,
      })
      .then(() => {
        alert('Feature added successfully!');
        navigate(`/features/${selectedProjectId}`);
      })
      .catch((err) => {
        console.error('Failed to save feature:', err);
        alert('Error saving feature.');
      });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="features-page">
      <h2 className="features-header">Add Feature</h2>

      {/* <button type="button" className="back-btn" onClick={handleBack}>
        Back
      </button> */}

      <form onSubmit={handleSubmit} className="feature-form">
        <div className="form-group">
          <label>Select Project</label>
          <select value={selectedProjectId} onChange={handleProjectSelect}>
            <option value="">-- Select a project --</option>
            {projects.map((project) => (
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
              <input
                name="name"
                value={feature.name}
                onChange={handleChange}
                required
                placeholder="Enter feature name"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={feature.description}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Enter feature description"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
             <select
              name="status"
              value={feature.status?.id || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select a status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.decription}
                </option>
              ))}
            </select>
            </div>

            <div className="form-actions">
              <button type="button" className="back-btn" onClick={handleBack}>
                Back
              </button>
              <button type="submit" className="submit-btn">
                Add Feature
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default Features;
