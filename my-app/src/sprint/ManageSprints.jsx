import React, { useEffect, useState } from 'react';
import { FaEdit } from "react-icons/fa";
import api from '../api';
import Select from 'react-select';
import './ManageSprints.css';
import { useNavigate } from 'react-router-dom';
import { FaTasks, FaPlus, FaEye } from 'react-icons/fa';

const ManageSprints = () => {
  const [sprints, setSprints] = useState([]);
  const [filteredSprints, setFilteredSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  // ✅ Fetch all required data
  useEffect(() => {
    fetchProjects();
    fetchSprints();
    fetchUser();

    const storedProject = sessionStorage.getItem('selectedProject');
    const storedFeature = sessionStorage.getItem('selectedFeature');

    if (storedProject) {
      const projObj = JSON.parse(storedProject);
      setSelectedProject(projObj);
      fetchFeatures(projObj.value);
    }
    if (storedFeature) {
      setSelectedFeature(JSON.parse(storedFeature));
    }
  }, []);

  const fetchProjects = () => {
    api.get('/projects', { withCredentials: true })
      .then(res => setProjects(res.data))
      .catch(err => console.error('Error fetching projects:', err));
  };

  const fetchFeatures = (projectId) => {
    api.get(`/features/project/${projectId}`, { withCredentials: true })
      .then(res => setFeatures(res.data))
      .catch(err => console.error('Error fetching features:', err));
  };

  const fetchSprints = () => {
    api.get(`/sprints`, { withCredentials: true })
      .then(res => {
        setSprints(res.data);
        setFilteredSprints(res.data);
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

  useEffect(() => {
    if (selectedProject) {
      fetchFeatures(selectedProject.value);
    } else {
      setFeatures([]);
      setSelectedFeature(null);
    }
  }, [selectedProject]);

  const handleSearch = () => {
    if (!selectedProject) {
      setFilteredSprints([]);
      return;
    }

    sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    sessionStorage.setItem('selectedFeature', JSON.stringify(selectedFeature));

    let tempSprints = sprints.filter(s => s.feature.project?.id === selectedProject.value);

    if (selectedFeature) {
      tempSprints = tempSprints.filter(s => s.feature?.id === selectedFeature.value);
    }

    setFilteredSprints(tempSprints);
  };

  const handleReset = () => {
    setSelectedProject(null);
    setSelectedFeature(null);
    setFeatures([]);
    setFilteredSprints([]);
    sessionStorage.removeItem('selectedProject');
    sessionStorage.removeItem('selectedFeature');
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
      <div className="sprint-header">
        <h2>Manage Sprints</h2>
        <div className="top-actions">
          <span className="user-label">{userName}</span>
          <button className="create-sprint-btn" onClick={() => navigate('/create-sprint')}>
            <FaPlus className="icon" /> Create Sprint
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <Select
          options={projectOptions}
          value={selectedProject}
          onChange={option => setSelectedProject(option)}
          isClearable
          placeholder="-- Select Project --"
        />
        <Select
          options={featureOptions}
          value={selectedFeature}
          onChange={option => setSelectedFeature(option)}
          isClearable
          placeholder="-- Select Feature --"
          isDisabled={!features.length}
        />
        <button className="search-btn" onClick={handleSearch}>Search</button>
        <button className="reset-btn" onClick={handleReset}>Reset</button>
      </div>
<table className="sprint-table">
  <thead>
    <tr>
      <th>Sprint ID</th>
      <th>Name</th>
      <th>Start Date</th>
      <th>End Date</th>
      <th>Feature Name</th>
      <th>Sprint Goals</th> {/* ✅ New Column */}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {!selectedProject ? (
      <tr>
        <td colSpan="7" style={{ textAlign: "center" }}>
          Please select a project to view sprints.
        </td>
      </tr>
    ) : filteredSprints.length === 0 ? (
      <tr>
        <td colSpan="7" style={{ textAlign: "center" }}>
          No sprints found.
        </td>
      </tr>
    ) : (
      filteredSprints.map((sprint) => {
        const completed = isSprintCompleted(sprint.endDate);
        const shortGoal =
          sprint.sprintGoals && sprint.sprintGoals.length > 50
            ? sprint.sprintGoals.substring(0, 50) + "..."
            : sprint.sprintGoals || "-";
        return (
          <tr key={sprint.id}>
            <td>{sprint.id}</td>
            <td>{sprint.name}</td>
            <td>{sprint.startDate}</td>
            <td>{sprint.endDate}</td>
            <td>{sprint.feature?.name || "-"}</td>
            <td title={sprint.sprintGoals || ""}>{shortGoal}</td> {/* ✅ Tooltip */}
            <td>
              {!completed && (
                <button
                  onClick={() =>
                    navigate(`/sprints/${sprint.id}/assign-stories/${sprint.feature?.id}`)
                  }
                  className="active-btn"
                >
                  Assign Tasks
                </button>
              )}
              <button
                onClick={() => navigate(`/sprints/overview/${sprint.id}`)}
                className="view-btn"
              >
                View
              </button>
              <button
            onClick={() => navigate(`/edit-sprint/${sprint.id}`)}
            className="edit-btn"
            style={{ backgroundColor: "#ffc107", color: "#000", marginLeft: "5px" }}
          >
            {FaEdit}
          </button>
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
