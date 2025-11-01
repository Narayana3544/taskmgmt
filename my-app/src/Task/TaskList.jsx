import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "./TaskList.css";
import { FaEdit, FaPlus, FaEye } from "react-icons/fa";

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

  // Filters
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchStory, setSearchStory] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const tasksPerPage = 5;
  const navigate = useNavigate();

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

  const handleProjectChange = (option) => {
    const projectId = option ? option.value : null;
    setSelectedProject(projectId);
    setSelectedFeature("");
    setSelectedSprint("");
    setSelectedUser("");
    setSelectedStatus("");
    setSearchStory("");

    if (projectId) {
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
    .filter((t) => (selectedFeature ? t.feature?.id === parseInt(selectedFeature) : true))
    .filter((t) => (selectedSprint ? t.sprint?.id === parseInt(selectedSprint) : true))
    .filter((t) => (selectedUser ? t.user?.id === parseInt(selectedUser) : true))
    .filter((t) => (selectedStatus ? t.taskStatus?.id === parseInt(selectedStatus) : true))
    .filter((t) => t.userstory?.toLowerCase().includes(searchStory.toLowerCase()));

  const indexOfLastTask = (currentPage + 1) * tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfLastTask - tasksPerPage, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return (
    <div className="task-list-page">
      <h2>Search Tasks</h2>

      <div className="header-bar">
        <div className="filter-section">
          {/* ✅ Searchable dropdown using react-select */}
          <Select
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            value={projects.find((p) => p.id === selectedProject)
              ? { value: selectedProject, label: projects.find((p) => p.id === selectedProject)?.name }
              : null}
            onChange={handleProjectChange}
            placeholder="Select Project..."
            isClearable
            className="project-select"
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
              <th>
                Story<br />
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
              <th>
                Sprint<br />
                <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}>
                  <option value="">All</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </th>
              <th>
                Feature<br />
                <select value={selectedFeature} onChange={(e) => setSelectedFeature(e.target.value)}>
                  <option value="">All</option>
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </th>
              <th>
                Assigned User<br />
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                  <option value="">All</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.preferredName || u.username}
                    </option>
                  ))}
                </select>
              </th>
              <th>Task Type</th>
              <th>
                Status<br />
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.decription}</option>
                  ))}
                </select>
              </th>
              <th>Start Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {!selectedProject ? (
              <tr><td colSpan="9" className="no-data">Select a project to see tasks.</td></tr>
            ) : currentTasks.length === 0 ? (
              <tr><td colSpan="9" className="no-data">No tasks found.</td></tr>
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
                    <div className="action-buttons">
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => navigate(`/task/${task.id}`)}>
                          <FaEye />
                        </button>
                        <span className="tooltip-text">View Task</span>
                      </div>
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => navigate(`/edit-task/${task.id}`)}>
                          <FaEdit />
                        </button>
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
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))} disabled={currentPage === 0}>
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)} className={currentPage === i ? "active" : ""}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))} disabled={currentPage === totalPages - 1}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
