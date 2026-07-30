import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import './FeatureList.css';
import { FaEdit, FaEye } from 'react-icons/fa'; // ✅ Icons
import { sortLatestFirst } from "../utils/sortUtils";
import StatusSummary from '../components/StatusSummary';
import Pagination from '../components/Pagination';

const FeatureList = () => {
  const [features, setFeatures] = useState([]);
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = sessionStorage.getItem("FeatureList_selectedProject");
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("FeatureList_currentPage");
    return saved ? parseInt(saved) : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = sessionStorage.getItem("FeatureList_itemsPerPage");
    return saved ? parseInt(saved) : 5;
  });

  useEffect(() => {
    api.get('/features', { withCredentials: true })
      .then(res => {
        const sorted = sortLatestFirst(res.data);
        setFeatures(sorted);
        setFilteredFeatures(sorted);
      })
      .catch(err => console.error('Error fetching features:', err));

    api.get('/projects', { withCredentials: true })
      .then(res => {
        setProjects(sortLatestFirst(res.data));
      })
      .catch(err => console.error('Error fetching projects:', err));
  }, []);

  useEffect(() => {
    sessionStorage.setItem("FeatureList_currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem("FeatureList_itemsPerPage", itemsPerPage);
  }, [itemsPerPage]);

  useEffect(() => {
    sessionStorage.setItem("FeatureList_selectedProject", JSON.stringify(selectedProject));
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) {
      setFilteredFeatures(features);
    } else {
      const filtered = features.filter(feature =>
        feature.project?.id === selectedProject.value
      );
      setFilteredFeatures(filtered);
    }
  }, [selectedProject, features]);

  const indexOfLastFeature = currentPage * itemsPerPage;
  const currentFeatures = filteredFeatures.slice(indexOfLastFeature - itemsPerPage, indexOfLastFeature);

  const projectOptions = projects.map(p => ({ label: p.name, value: p.id }));

  return (
    <div className="features-list-page">
      <div className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
          <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Features</h2>

          {/* 🔍 Project Dropdown Inline */}
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={(option) => { setSelectedProject(option); setCurrentPage(1); }}
            isClearable
            placeholder="-- Select Project --"
            menuPortalTarget={document.body}
            styles={{ 
              container: (base) => ({ ...base, minWidth: '200px' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
          />

          <StatusSummary data={filteredFeatures} statusExtractor={(feature) => feature.status?.decription || feature.status || 'Unknown'} showBuckets={['In Progress', 'Completed']} ignoreUnassigned={true} />
        </div>

        <button className="btn-global btn-primary" onClick={() => navigate('/features')} style={{ flexShrink: 0 }}>
          + Create Feature
        </button>
      </div>

      {filteredFeatures.length === 0 ? (
        <p>No features found.</p>
      ) : (
        <table className="features-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Project Name</th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentFeatures.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.id}</td>
                <td>{feature.project?.name}</td>
                <td>{feature.name}</td>
                <td className="ellipsis-cell" title={feature.description}>{feature.description}</td>
                <td>
                  <span className="status">
                    {feature.status?.decription || 'Unknown'}
                  </span>
                </td>
                <td className="action-buttons">
                  {/* 👁️ View Sprints */}
                  <div className="tooltip">
                    <FaEye
                      className="icon-btn view-icon"
                      onClick={() => navigate(`/ViewSprintsByFeatureid/${feature.id}`)}
                    />
                    <span className="tooltip-text">View Sprints</span>
                  </div>

                  {/* 🖊️ Edit */}
                  <div className="tooltip">
                    <FaEdit
                      className="icon-btn edit-icon"
                      onClick={() => navigate(`/edit-feature/${feature.id}`)}
                    />
                    <span className="tooltip-text">Edit Feature</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filteredFeatures.length > 0 && (
        <Pagination
          totalItems={filteredFeatures.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  );
};

export default FeatureList;