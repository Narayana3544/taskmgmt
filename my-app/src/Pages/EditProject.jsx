import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditProject.css';

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState({
    name: '',
    description: '',
    status: '' // will store status ID
  });

  const [statuses, setStatuses] = useState([]);

  // Fetch project + statuses
  useEffect(() => {
    // Get statuses for dropdown
    axios.get('http://localhost:8080/api/getstatus', { withCredentials: true })
      .then(res => setStatuses(res.data))
      .catch(err => console.error('Failed to load statuses:', err));

    // Get project details
    axios.get(`http://localhost:8080/api/projects/${id}`, { withCredentials: true })
      .then(res => {
        const proj = res.data;
        setProject({
          name: proj.name,
          description: proj.description,
          status: proj.status?.id || '' // store ID
        });
      })
      .catch(err => console.error('Failed to load project:', err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: project.name,
      description: project.description,
      status: { id: project.status } // send status ID object
    };

    axios.put(`http://localhost:8080/api/projects/${id}`, payload, { withCredentials: true })
      .then(() => {
        alert('Project updated successfully!');
        navigate('/manage-projects');
      })
      .catch(err => console.error('Failed to update project:', err));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      axios
        .delete(`http://localhost:8080/api/projects/${id}`, { withCredentials: true })
        .then(() => {
          alert("Project deleted successfully!");
          navigate("/manage-projects");
        })
        .catch((err) => {
          console.error("Error deleting project:", err);
          alert("It may be linked to other features");
        });
    }
  };

  return (
    <div className="edit-project-page">
      <div className="edit-main">
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
            <select
              name="status"
              value={project.status}
              onChange={handleChange}
              required
            >
              <option value="">Select a status</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.decription}
                </option>
              ))}
            </select>

            <div className="button-group">
              <button type="submit" className="save-btn">Save</button>
              <button type="button" className="delete-btn" onClick={handleDelete}>Delete</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/manage-projects")}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}