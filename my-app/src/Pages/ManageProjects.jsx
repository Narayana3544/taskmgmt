import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import Navbar from '../components/Navbar';
import './ManageProject.css';
import { FaEye, FaEdit, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    axios.get('http://localhost:8080/api/projects', { withCredentials: true })
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
  };

  const handleView = (project) => {
    alert(`Viewing Project:\nID: ${project.id}\nName: ${project.name}\nDescription: ${project.description}`);
  };

  const handleStatusChange = (id, newStatus) => {
    axios.patch(`http://localhost:8080/api/projects/${id}`, { status: newStatus }, { withCredentials: true })
      .then(() => fetchProjects())
      .catch(err => console.error('Failed to update status:', err));
  };

  const filteredProjects = Array.isArray(projects)
  ? projects.filter(project =>
      (project.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       project.id?.toString() === searchTerm.trim())
    )
  : [];


  return (
    <div className="manage-projects-page">
      <div className="manage-main">
        {/* <Navbar /> */}
        <div className="manage-container">
          <div className="manage-header">
            <h1 className="manage-title">Manage Projects</h1>
            <button className="create-btn" onClick={() => navigate('/create-project')}>
              <FaPlus /> Create Project
            </button>
          </div>

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

          <table className="projects-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Change Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr><td colSpan="6">No projects found.</td></tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project.id}>
                    <td>{project.id}</td>
                    <td>{project.name}</td>
                    <td>{project.description}</td>
                    <td>
                      <span className={`status-tag ${project.status?.toLowerCase() || 'inprogress'}`}>
                        {project.status || 'In Progress'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={project.status || 'In Progress'}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                      >
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Pending</option>
                      </select>
                    </td>
                    <td className="action-buttons">
                      <button onClick={() => handleView(project)} className="view-btn"><FaEye /></button>
                      <button onClick={() => handleEdit(project.id)} className="edit-btn"><FaEdit /> Edit</button>
                      <button onClick={() => deleteProject(project.id)} className="delete-btn">Delete</button>
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
