import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import Navbar from '../components/Navbar';
// import '../Pages/ManageProject.css';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ViewProjectById() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    axios.get(`http://localhost:8080/api/project/assignedtouser`, { withCredentials: true })
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
        {/* <Navbar /> */}
        <div className="manage-container">
          <div className="manage-header">
            <h1 className="manage-title">Your Assigned Projects</h1>
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
                {/* <th>Change Status</th> */}
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
                      <span
                        className={`status-tag ${
                          project.status?.decription?.toLowerCase().replace(/\s+/g, '-') || ''
                        }`}
                      >
                        {project.status?.decription || "No status"}
                      </span>
                    </td>
                     <td>
                        {/* <button 
                        className="edit-btn" 
                        onClick={() => navigate(`/edit-project/${project.id}`)}
                      > 
                      <FaEdit />
                      </button> */}
                      <button 
                    className="view-btn" 
                    onClick={() => navigate(`/view-project/${project.id}`)}
                  >
                    View
                  </button>
                      {/* <button 
                    className="view-btn" 
                    onClick={() => navigate(`/view-featuresByprojectid/${project.id}`)}
                  >
                    View
                  </button> */}
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
