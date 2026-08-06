import React, { useEffect, useState } from 'react';
import api from '../api';
import './ManageProject.css';
import { FaEdit, FaPlus, FaUsers, FaListUl, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { sortLatestFirst } from "../utils/sortUtils";
import StatusSummary from '../components/StatusSummary';

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);
  const fetchProjects = () => {
    api
      .get('/projects', { withCredentials: true })
      .then((res) => setProjects(sortLatestFirst(res.data)))
      .catch((err) => console.error('Error fetching projects:', err));
  };
  const filteredProjects = Array.isArray(projects)
    ? projects.filter((project) => {
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
      <div className="manage-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h2 className="manage-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>Projects</h2>

        <button
          className="btn-global btn-primary"
          onClick={() => navigate('/create-project')}
          style={{ flexShrink: 0 }}
        >
          <FaPlus /> Create Project
        </button>
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
              <tr>
                <td colSpan="5">No projects found.</td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>{project.id}</td>
                  <td>{project.name}</td>
                  <td className="ellipsis-cell" title={project.description}>{project.description}</td>
                  <td>
                    <span
                      className={`status ${
                        project.status?.decription
                          ?.toLowerCase()
                          .replace(/\s+/g, '-') || ''
                      }`}
                    >
                      {project.status?.decription || 'No status'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {/* 👥 Assign Users */}
                    <div className="tooltip">
                      <FaUsers
                        className="icon-btn assign-icon"
                        onClick={() =>
                          navigate(`/view-project/${project.id}`)
                        }
                      />
                      <span className="tooltip-text">Assign Users</span>
                    </div>

                    {/* 📋 View Features */}
                    <div className="tooltip">
                      <FaEye
                        className="icon-btn view-icon"
                        onClick={() =>
                          navigate(`/view-featuresByprojectid/${project.id}`)
                        }
                      />
                      <span className="tooltip-text">View Features</span>
                    </div>

                    {/* ✏️ Edit */}
                    <div className="tooltip">
                      <FaEdit
                        className="icon-btn edit-icon"
                        onClick={() =>
                          navigate(`/edit-project/${project.id}`)
                        }
                      />
                      <span className="tooltip-text">Edit Project</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    </div>
  );
}