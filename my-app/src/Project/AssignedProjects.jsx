import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaList } from 'react-icons/fa';
import StatusSummary from '../components/StatusSummary';

export default function ViewProjectById() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    api.get(`/project/assignedtouser`, { withCredentials: true })
      .then(res => setProjects(res.data))
      .catch(err => console.error('Error fetching projects:', err));
  };

  const deleteProject = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      api.delete(`/projects/${id}`)
        .then(() => fetchProjects())
        .catch(err => console.error('Error deleting project:', err));
    }
  };

  const filteredProjects = Array.isArray(projects)
    ? projects.filter(project => {
        const search = searchTerm.toLowerCase();
        return (
          project.name?.toLowerCase().includes(search) ||
          project.status?.decription?.toLowerCase().includes(search) || 
          project.id?.toString() === searchTerm.trim()
        );
      })
    : [];

  return (
    <div className="manage-projects-page">
      <div className="manage-main">
        <div className="manage-container">
          <div className="manage-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
            <h1 className="manage-title" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '1.2rem', fontWeight: 700 }}>Your Assigned Projects</h1>
          </div>

          <table className="projects-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.length === 0 ? (
                <tr><td colSpan="5">No projects found.</td></tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project.id}>
                    <td>{project.id}</td>
                    <td>{project.name}</td>
                    <td>{project.description}</td>
                    <td>
                      <span className={`status-tag ${project.status?.decription?.toLowerCase().replace(/\s+/g, '-') || ''}`}>
                        {project.status?.decription || "No status"}
                      </span>
                    </td>
                    
                    {/* ✅ ICON BUTTONS */}
                    <td className="action-col">
                      <button 
                        className="icon-btn" 
                        onClick={() => navigate(`/view-project/${project.id}`)}
                        title="View Project"
                        style={{
                          background: "#007bff",
                          border: "none",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <FaEye />
                      </button>

                      <button 
                        className="icon-btn"
                        onClick={() => navigate(`/view-featuresByprojectid/${project.id}`)}
                        title="View Features"
                        style={{
                          background: "#007bff",
                          border: "none",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <FaList />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
