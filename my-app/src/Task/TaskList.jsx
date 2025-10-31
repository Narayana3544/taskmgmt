import React, { useEffect, useState } from "react";
import Select from "react-select";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaPlus, FaEye } from "react-icons/fa";
import "./TaskList.css";

export default function TaskList() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchStory, setSearchStory] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const tasksPerPage = 5;
  const navigate = useNavigate();

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "32px",
      height: "32px",
      fontSize: "13px",
      borderColor: state.isFocused ? "#2875e7" : "#ccc",
      boxShadow: state.isFocused ? "0 0 0 1px #2875e7" : "none",
      "&:hover": { borderColor: "#2875e7" },
    }),
    singleValue: (base) => ({ ...base, color: "black" }),
    input: (base) => ({ ...base, color: "black" }),
    placeholder: (base) => ({ ...base, color: "#555" }),
    option: (base, state) => ({
      ...base,
      color: state.isSelected ? "white" : "black",
      backgroundColor: state.isSelected ? "#2875e7" : "white",
      "&:hover": { backgroundColor: "#e6f0ff" },
    }),
    menu: (base) => ({ ...base, fontSize: "13px", color: "black" }),
  };

  useEffect(() => {
    fetchProjects();
    fetchStatuses();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects", { withCredentials: true });
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await api.get("/getstatusForTask", { withCredentials: true });
      setStatuses(res.data);
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  const fetchFeatures = async (projectId) => {
    try {
      const res = await api.get(`/features/project/${projectId}`, { withCredentials: true });
      setFeatures(res.data);
    } catch {
      setFeatures([]);
    }
  };

  const fetchSprints = async (projectId) => {
    try {
      const res = await api.get(`/project/sprints/${projectId}`, { withCredentials: true });
      setSprints(res.data);
    } catch {
      setSprints([]);
    }
  };

  const fetchUsers = async (projectId) => {
    try {
      const res = await api.get(`/project/users/${projectId}`, { withCredentials: true });
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
  };

  const fetchTasks = async (projectId) => {
    setLoading(true);
    try {
      const res = await api.get(`/viewTaskByProjectId/${projectId}`, { withCredentials: true });
      setTasks(res.data);
      setCurrentPage(0);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const featureOptions = features.map((f) => ({ value: f.id, label: f.name }));
  const sprintOptions = sprints.map((s) => ({ value: s.id, label: s.name }));
  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.first_name || u.preferredName || u.username,
  }));
  const statusOptions = statuses.map((s) => ({ value: s.id, label: s.decription }));

  const handleProjectChange = (option) => {
    setSelectedProject(option);
    setSelectedFeature(null);
    setSelectedSprint(null);
    setSelectedUser(null);
    setSelectedStatus(null);
    setSearchStory("");

    if (option) {
      const projectId = option.value;
      fetchTasks(projectId);
      fetchFeatures(projectId);
      fetchUsers(projectId);
      fetchSprints(projectId);
    } else {
      setTasks([]);
      setFeatures([]);
      setUsers([]);
      setSprints([]);
    }
  };

  const filteredTasks = tasks
    .filter((t) => (selectedFeature ? t.feature?.id === selectedFeature.value : true))
    .filter((t) => (selectedSprint ? t.sprint?.id === selectedSprint.value : true))
    .filter((t) => (selectedUser ? t.user?.id === selectedUser.value : true))
    .filter((t) => (selectedStatus ? t.taskStatus?.id === selectedStatus.value : true))
    .filter((t) => t.userstory?.toLowerCase().includes(searchStory.toLowerCase()));

  const indexOfLastTask = (currentPage + 1) * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return (
    <div className="task-list-page">
       <h2>Search Tasks</h2>
      <div className="header-bar">
        <div className="select-wrapper">
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={handleProjectChange}
            isClearable
            placeholder="-- Select Project --"
            styles={customStyles}
          />
        </div>

        <button className="create-btn" onClick={() => navigate("/create-task")}>
          <FaPlus /> Create Task
        </button>
      </div>

      {loading && <p>Loading tasks...</p>}
      {error && <p>{error}</p>}

      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th>Story<br />
                <input
                  type="text"
                  placeholder="Search Story"
                  value={searchStory}
                  onChange={(e) => {
                    setSearchStory(e.target.value);
                    setCurrentPage(0);
                  }}
                />
              </th>
              <th>Story Points</th>
              <th>Sprint</th>
              <th>Feature</th>
              <th>Assigned User</th>
              <th>Task Type</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {!selectedProject ? (
              <tr><td colSpan="9" style={{ textAlign: "center" }}>Select a project to see tasks.</td></tr>
            ) : currentTasks.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: "center" }}>No tasks found.</td></tr>
            ) : (
              currentTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.userstory || "-"}</td>
                  <td>{task.storypoints ?? "-"}</td>
                  <td>{task.sprint?.name || "-"}</td>
                  <td>{task.feature?.name || "-"}</td>
                  <td>{task.user?.first_name || "-"}</td>
                  <td>{task.taskType?.description || "-"}</td>
                  <td>{task.taskStatus?.decription || task.taskStatus?.description || "No Status"}</td>
                  <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>
                  <td>
                    <div className="icon-buttons">
                      <div className="tooltip">
                        <FaEye className="icon-btn view-icon" onClick={() => navigate(`/task/${task.id}`)} />
                        <span className="tooltip-text">View Task</span>
                      </div>
                      <div className="tooltip">
                        <FaEdit className="icon-btn edit-icon" onClick={() => navigate(`/edit-task/${task.id}`)} />
                        <span className="tooltip-text">Edit Task</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {selectedProject && totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))} disabled={currentPage === 0}>
              Prev
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={currentPage === index ? "active" : ""}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
