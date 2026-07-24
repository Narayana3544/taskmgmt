import React, { useEffect, useState } from 'react';
import api from '../api';
import Select from 'react-select';
import './ManageSprints.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sortLatestFirst } from "../utils/sortUtils";
import { FaTasks, FaPlus, FaEye } from 'react-icons/fa';
import { FaEdit } from "react-icons/fa";
import StatusSummary from '../components/StatusSummary';

const ManageSprints = () => {
  const [sprints, setSprints] = useState([]);
  const [filteredSprints, setFilteredSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // ✅ Fetch all required data and initialize from URL params
  useEffect(() => {
    fetchProjects();
    fetchSprints();
    fetchUser();
    const urlProject = searchParams.get('project');
    const urlFeature = searchParams.get('feature');
    if (urlProject) {
      // We only store IDs in URL, but react-select needs an object.
      // We will set selectedProject when projects are loaded.
      // So this is handled in another useEffect below.
    }
  }, []);
  const fetchProjects = () => {
    api.get('/projects', { withCredentials: true })
      .then(res => setProjects(sortLatestFirst(res.data)))
      .catch(err => console.error('Error fetching projects:', err));
  };
  const fetchFeatures = (projectId) => {
    api.get(`/features/project/${projectId}`, { withCredentials: true })
      .then(res => setFeatures(sortLatestFirst(res.data)))
      .catch(err => console.error('Error fetching features:', err));
  };
  const fetchSprints = () => {
    api.get(`/sprints`, { withCredentials: true })
      .then(res => {
        const sorted = sortLatestFirst(res.data);
        setSprints(sorted);
        setFilteredSprints(sorted);
      })
      .catch(err => console.error('Error fetching sprints:', err));
  };
  const fetchUser = () => {
    api.get('/user/profile', { withCredentials: true })
      .then(res => setUserName(res.data.preffered_name))
      .catch(err => console.error('Error fetching user profile:', err));
  };
  const projectOptions = projects.map(p => ({ value: p.id, label: p.name }));
  const featureOptions = features.map(f => ({ value: f.id, label: f.name }));
  // ✅ Sync URL params with select state once projects/features are loaded
  useEffect(() => {
    const urlProject = searchParams.get('project');
    if (urlProject && projects.length > 0) {
      const pId = parseInt(urlProject);
      const proj = projects.find(p => p.id === pId);
      if (proj && (!selectedProject || selectedProject.value !== pId)) {
        setSelectedProject({ value: proj.id, label: proj.name });
      }
    }
  }, [projects, searchParams]);
  useEffect(() => {
    const urlFeature = searchParams.get('feature');
    if (urlFeature && features.length > 0) {
      const fId = parseInt(urlFeature);
      const feat = features.find(f => f.id === fId);
      if (feat && (!selectedFeature || selectedFeature.value !== fId)) {
        setSelectedFeature({ value: feat.id, label: feat.name });
      }
    }
  }, [features, searchParams]);

  useEffect(() => {
    if (selectedProject) {
      fetchFeatures(selectedProject.value);
    } else {
      setFeatures([]);
      setSelectedFeature(null);
    }
  }, [selectedProject]);

  // ✅ Auto-filter sprints whenever sprints, selectedProject, or selectedFeature change
  useEffect(() => {
    if (!selectedProject) {
      setFilteredSprints([]);
      return;
    }

    let tempSprints = sprints.filter(s => s.feature?.project?.id === selectedProject.value);

    if (selectedFeature) {
      tempSprints = tempSprints.filter(s => s.feature?.id === selectedFeature.value);
    }

    setFilteredSprints(tempSprints);
  }, [sprints, selectedProject, selectedFeature]);

  const handleProjectChange = (option) => {
    setSelectedProject(option);
    setSelectedFeature(null); // Reset feature when project changes
    if (option) {
      searchParams.set('project', option.value);
      searchParams.delete('feature');
    } else {
      searchParams.delete('project');
      searchParams.delete('feature');
    }
    setSearchParams(searchParams);
  };

  const handleFeatureChange = (option) => {
    setSelectedFeature(option);
    if (option) {
      searchParams.set('feature', option.value);
    } else {
      searchParams.delete('feature');
    }
    setSearchParams(searchParams);
  };

  // ✅ Check if sprint is completed or end date has passed
  const isSprintDisabled = (sprint) => {
    const today = new Date();
    const endDate = new Date(sprint.endDate);
    return (
      sprint.status?.toLowerCase() === 'completed' ||
      sprint.status?.toLowerCase() === 'closed' ||
      endDate < today
    );
  };

  return (
    <div className="manage-sprints-page">
      <div className="sprint-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
          <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Sprints</h2>
          
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={handleProjectChange}
            isClearable
            placeholder="-- Select Project --"
            styles={{ container: (base) => ({ ...base, minWidth: '200px' }) }}
          />

          <StatusSummary 
            data={filteredSprints} 
            statusExtractor={(sprint) => isSprintDisabled(sprint) ? 'Inactive' : 'Active'} 
            showBuckets={['Active', 'Inactive']}
          />
        </div>

        <div className="top-actions" style={{ flexShrink: 0 }}>
          <button className="create-sprint-btn" onClick={() => navigate('/create-sprint')}>
            <FaPlus className="icon" /> Create Sprint
          </button>
        </div>
      </div>

      {/* Table Section */}
      <table className="sprint-table">
      <thead>
        <tr>
          <th>Sprint ID</th>
          <th>Name</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Feature</th>
          <th>Goals</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {!selectedProject ? (
          <tr>
            <td colSpan="7" className="no-data">
              Please select a project to view sprints.
            </td>
          </tr>
        ) : filteredSprints.length === 0 ? (
          <tr>
            <td colSpan="7" className="no-data">
              No sprints found.
            </td>
          </tr>
        ) : (
          filteredSprints.map((sprint) => {
            const completed = isSprintDisabled(sprint);
            const shortGoal =
              sprint.sprintGoals && sprint.sprintGoals.length > 50
                ? sprint.sprintGoals.substring(0, 50) + "..."
                : sprint.sprintGoals || "-";

            return (
              <tr key={sprint.id} className={completed ? "disabled-row" : ""}>
                <td>{sprint.id}</td>
                <td>{sprint.name}</td>
                <td>{sprint.startDate}</td>
                <td>{sprint.endDate}</td>
                <td>{sprint.feature?.name || "-"}</td>
                <td title={sprint.sprintGoals}>{shortGoal}</td>

                <td>
                  <div className="action-buttons">

                    {/* View */}
                    <div className="tooltip-container">
                      <button
                        className="icon-small-btn"
                        onClick={() => navigate(`/sprints/overview/${sprint.id}`)}
                      >
                        <FaEye />
                      </button>
                      <span className="tooltip-text">View Sprint</span>
                    </div>

                    {/* Assign Stories */}
                    {!completed && (
                      <div className="tooltip-container">
                        <button
                          className="icon-small-btn"
                          onClick={() =>
                            navigate(`/sprints/${sprint.id}/assign-stories/${sprint.feature?.id}`)
                          }
                        >
                          <FaTasks />
                        </button>
                        <span className="tooltip-text">Assign Tasks</span>
                      </div>
                    )}

                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
    </div>
  );
};

export default ManageSprints;