import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
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
       api
      .get('/getstatusForProject', { withCredentials: true })
      .then((res) => setStatuses(res.data))
      .catch((err) => console.error('Failed to load statuses:', err));

    // Get project details
     api
      .get(`/projects/${id}`, { withCredentials: true })
      .then((res) => {
        const proj = res.data;
        setProject({
          name: proj.name,
          description: proj.description,
          status: proj.status?.id || '' // store ID
        });
      })
      .catch((err) => console.error('Failed to load project:', err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is trying to close the project
    const selectedStatusObj = statuses.find(s => s.id === parseInt(project.status));
    const isClosing = selectedStatusObj && 
      (selectedStatusObj.decription.toLowerCase() === 'closed' || selectedStatusObj.decription.toLowerCase() === 'completed');

    if (isClosing) {
      try {
        const featuresRes = await api.get(`/features/project/${id}`, { withCredentials: true });
        const sprintsRes = await api.get(`/project/sprints/${id}`, { withCredentials: true });
        
        const hasOpenFeatures = featuresRes.data.some(f => {
          const stat = f.status?.decription?.toLowerCase() || '';
          return stat !== 'closed' && stat !== 'completed';
        });

        const hasOpenSprints = sprintsRes.data.some(s => {
          const stat = s.status?.toLowerCase() || '';
          return stat !== 'closed' && stat !== 'completed';
        });

        if (hasOpenFeatures || hasOpenSprints) {
          alert("Please close tasks, features, sprints first.");
          return; // Stop submission
        }
      } catch (err) {
        console.error("Error validating project closure:", err);
        alert("Failed to validate project closure requirements.");
        return;
      }
    }

    const payload = {
      name: project.name,
      description: project.description,
      status: { id: project.status } // send status ID object
    };

    api.put(`/projects/${id}`, payload, { withCredentials: true })
      .then(() => {
        alert('Project updated successfully!');
        navigate('/manage-projects');
      })
     .catch((err) => console.error('Failed to update project:', err));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      api
        .delete(`/projects/${id}`, { withCredentials: true })
        .then(() => {
                 alert('Project deleted successfully!');
          navigate('/manage-projects');
        })
        .catch((err) => {
           console.error('Error deleting project:', err);
          alert('It may be linked to other features');
        });
    }
  };

  return (
    <div className="edit-project-page">
      <div className="edit-main">
        <div className="edit-container">
           <h3>Edit Project</h3>
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
                {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.decription}
                </option>
              ))}
            </select>

            <div className="btn-container full-width">
              <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
              <button type="button" className="btn-global btn-danger" onClick={handleDelete}>Delete</button>
              <button type="submit" className="btn-global btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}