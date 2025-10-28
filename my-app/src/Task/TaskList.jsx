import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "./TaskList.css";
import { FaEdit, FaPlus } from "react-icons/fa";

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

  // Fetch initial data
  useEffect(() => {
    fetchProjects();
    fetchStatuses();
  }, []);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects", { withCredentials: true });
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  // Fetch statuses
  const fetchStatuses = async () => {
    try {
      const res = await api.get("/getstatusForTask", { withCredentials: true });
      setStatuses(res.data);
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  // Fetch features for selected project
  const fetchFeatures = async (projectId) => {
    try {
      const res = await api.get(`/features/project/${projectId}`, { withCredentials: true });
      setFeatures(res.data);
    } catch (err) {
      console.error("Error fetching features:", err);
      setFeatures([]);
    }
  };

 const fetchSprints = async (projectId) => {
  try {
    if (!projectId) {
      setSprints([]);
      return;
    }
    const res = await api.get(`/project/sprints/${projectId}`, { withCredentials: true });
    setSprints(res.data);
  } catch (err) {
    console.error("Error fetching sprints:", err);
    setSprints([]);
  }
};


  // Fetch users for selected project
  const fetchUsers = async (projectId) => {
    try {
      if (!projectId) {
        setUsers([]);
        return;
      }
      const res = await api.get(`/project/users/${projectId}`, { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  // Fetch tasks for selected project
  const fetchTasks = async (projectId) => {
    setLoading(true);
    try {
      const res = await api.get(`/viewTaskByProjectId/${projectId}`, { withCredentials: true });
      setTasks(res.data);
      setCurrentPage(0);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks.");
      setLoading(false);
    }
  };

  // Handle project change
  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId || null);

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

  // Handle feature change
  const handleFeatureChange = (e) => {
    const featureId = e.target.value;
    setSelectedFeature(featureId || "");
    setSelectedSprint("");
    // fetchSprints(featureId);
    setCurrentPage(0);
  };

  // Filtered tasks
  const filteredTasks = tasks
    .filter((t) => (selectedFeature ? t.feature?.id === parseInt(selectedFeature) : true))
    .filter((t) => (selectedSprint ? t.sprint?.id === parseInt(selectedSprint) : true))
    .filter((t) => (selectedUser ? t.user?.id === parseInt(selectedUser) : true))
    .filter((t) => (selectedStatus ? t.taskStatus?.id === parseInt(selectedStatus) : true))
    .filter((t) => t.userstory?.toLowerCase().includes(searchStory.toLowerCase()));

  // Pagination
  const indexOfLastTask = (currentPage + 1) * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return (
    <div className="task-list-page">
       <h2>Search Tasks</h2>
      <div className="header-bar">
        <select value={selectedProject || ""} onChange={handleProjectChange}>
          <option value="">-- Select Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
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
                Story
                <br />
                <input
                  type="text"
                  placeholder="Search Story"
                  value={searchStory}
                  onChange={(e) => { setSearchStory(e.target.value); setCurrentPage(0); }}
                />
              </th>
              <th>Story Points</th>
              <th>
                Sprint
                <br />
                <select value={selectedSprint} onChange={(e) => { setSelectedSprint(e.target.value); setCurrentPage(0); }}>
                  <option value="">All</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </th>
              <th>
                Feature
                <br />
                <select value={selectedFeature} onChange={handleFeatureChange}>
                  <option value="">All</option>
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </th>
              <th>
                Assigned User
                <br />
                <select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(0); }}>
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
                Status
                <br />
                <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(0); }}>
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
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>Select a project to see tasks.</td>
              </tr>
            ) : currentTasks.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>No tasks found.</td>
              </tr>
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
                    <div className="button-group">
                      <button className="view-btn" onClick={() => navigate(`/task/${task.id}`)}>View</button>
                      <button className="edit-btn" onClick={() => navigate(`/edit-task/${task.id}`)}><FaEdit /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {selectedProject && totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))} disabled={currentPage === 0}>Prev</button>
            {[...Array(totalPages)].map((_, index) => (
              <button key={index} onClick={() => setCurrentPage(index)} className={currentPage === index ? "active" : ""}>{index + 1}</button>
            ))}
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))} disabled={currentPage === totalPages - 1}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
