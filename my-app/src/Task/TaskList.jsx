import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import "./TaskList.css";
import { FaEdit, FaPlus, FaEye, FaDownload } from "react-icons/fa";
import { useDebounce } from "use-debounce";
import * as XLSX from "xlsx";

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

  // Debounced search
  const [debouncedStory] = useDebounce(searchStory, 350);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const tasksPerPage = 5;

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load filters from URL
  useEffect(() => {

    const project = searchParams.get("project") || "";
    const feature = searchParams.get("feature") || "";
    const sprint = searchParams.get("sprint") || "";
    const user = searchParams.get("user") || "";
    const status = searchParams.get("status") || "";
    const story = searchParams.get("story") || "";

    setSelectedProject(project);
    setSelectedFeature(feature);
    setSelectedSprint(sprint);
    setSelectedUser(user);
    setSelectedStatus(status);
    setSearchStory(story);

    fetchProjects();
    fetchStatuses();

    if (project) {
      Promise.all([
        fetchTasks(project),
        fetchFeatures(project),
        fetchUsers(project),
        fetchSprints(project)
      ]);
    }

  }, []);

  const updateURL = (key, value) => {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    setSearchParams(searchParams);
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects", { withCredentials: true });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await api.get("/getstatusForTask", { withCredentials: true });
      setStatuses(res.data);
    } catch (err) {
      console.error(err);
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

  const handleProjectChange = async (option) => {

    const projectId = option ? option.value : "";

    setSelectedProject(projectId);
    updateURL("project", projectId);

    if (projectId) {

      setLoading(true);

      try {
        await Promise.all([
          fetchTasks(projectId),
          fetchFeatures(projectId),
          fetchUsers(projectId),
          fetchSprints(projectId)
        ]);
      } finally {
        setLoading(false);
      }

    } else {
      setTasks([]);
      setFeatures([]);
      setUsers([]);
      setSprints([]);
    }

  };

  // Filtering
  const filteredTasks = useMemo(() => {

    return tasks
      .filter((t) => (selectedFeature ? t.feature?.id === parseInt(selectedFeature) : true))
      .filter((t) => (selectedSprint ? t.sprint?.id === parseInt(selectedSprint) : true))
      .filter((t) => (selectedUser ? t.user?.id === parseInt(selectedUser) : true))
      .filter((t) => (selectedStatus ? t.taskStatus?.id === parseInt(selectedStatus) : true))
      .filter((t) => t.userstory?.toLowerCase().includes(debouncedStory.toLowerCase()));

  }, [tasks, selectedFeature, selectedSprint, selectedUser, selectedStatus, debouncedStory]);

  // Pagination
  const indexOfLastTask = (currentPage + 1) * tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfLastTask - tasksPerPage, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // Download Excel
  const downloadExcel = () => {

    if (!selectedUser) {
      alert("Please select a user to download tasks");
      return;
    }

    const userTasks = filteredTasks.filter(
      (task) => task.user?.id === parseInt(selectedUser)
    );

    if (userTasks.length === 0) {
      alert("No tasks found for selected user");
      return;
    }

    const data = userTasks.map((task) => ({
      Story: task.userstory || "-",
      StoryPoints: task.storypoints || "-",
      Sprint: task.sprint?.name || "-",
      Feature: task.feature?.name || "-",
      AssignedTo: task.user?.first_name || "-",
      TaskType: task.taskType?.description || "-",
      Status: task.taskStatus?.description || "-",
      StartDate: task.start_date
        ? new Date(task.start_date).toLocaleDateString()
        : "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "UserTasks");

    XLSX.writeFile(workbook, "User_Tasks.xlsx");

  };

  return (

    <div className="task-list-page">

      <h2>Search Tasks</h2>

<div className="header-bar">

  <div className="filter-section">
    <Select
      options={projects.map((p) => ({ value: p.id, label: p.name }))}
      value={
        projects.find((p) => p.id == selectedProject)
          ? { value: selectedProject, label: projects.find((p) => p.id == selectedProject)?.name }
          : null
      }
      onChange={handleProjectChange}
      placeholder="Select Project..."
      isClearable
      className="project-select"
    />
  </div>

  <div className="header-actions">

    <button className="icon-download-btn" onClick={downloadExcel}>
      <FaDownload />
    </button>

    <button className="create-btn" onClick={() => navigate("/create-task")}>
      <FaPlus /> Create Task
    </button>

  </div>

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
                  onChange={(e) => {
                    setSearchStory(e.target.value);
                    updateURL("story", e.target.value);
                    setCurrentPage(0);
                  }}
                />
              </th>

              <th>Story Points</th>

              <th>
                Sprint
                <br />
                <select
                  value={selectedSprint}
                  onChange={(e) => {
                    setSelectedSprint(e.target.value);
                    updateURL("sprint", e.target.value);
                    setCurrentPage(0);
                  }}
                >
                  <option value="">All</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </th>

              <th>
                Feature
                <br />
                <select
                  value={selectedFeature}
                  onChange={(e) => {
                    setSelectedFeature(e.target.value);
                    updateURL("feature", e.target.value);
                    setCurrentPage(0);
                  }}
                >
                  <option value="">All</option>
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </th>

              <th>
                Assigned To
                <br />
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    updateURL("user", e.target.value);
                    setCurrentPage(0);
                  }}
                >
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
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    updateURL("status", e.target.value);
                    setCurrentPage(0);
                  }}
                >
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
                <td colSpan="9" className="no-data">
                  Select a project to see tasks.
                </td>
              </tr>
            ) : currentTasks.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  No tasks found.
                </td>
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
                  <td>{task.taskStatus?.description || "-"}</td>
                  <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>

                  <td>
                    <div className="action-buttons">

                      <button className="icon-btn" onClick={() => navigate(`/task/${task.id}`)}>
                        <FaEye />
                      </button>

                      <button className="icon-btn" onClick={() => navigate(`/edit-task/${task.id}`)}>
                        <FaEdit />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

        {selectedProject && totalPages > 1 && (

          <div className="pagination">

            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={currentPage === i ? "active" : ""}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
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