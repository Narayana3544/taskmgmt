import React, { useEffect, useState } from 'react';
import api from '../api';
import './ManageProject.css';
import { FaEdit, FaPlus, FaUsers, FaListUl } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { sortLatestFirst } from "../utils/sortUtils";

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
      <div className="manage-header">
        <h2 className="manage-title">Projects</h2>
          <button
            className="btn-global btn-primary"
            onClick={() => navigate('/create-project')}
          >
            <FaPlus /> Create Project
        </button>
      </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or ID"
            className="form-control-global"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                  <td>{project.description}</td>
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
                      <FaListUl
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