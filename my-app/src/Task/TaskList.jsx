import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import "./TaskList.css";
import { FaEdit, FaPlus, FaEye, FaDownload, FaLock } from "react-icons/fa";
import { useDebounce } from "use-debounce";
import * as XLSX from "xlsx";
import { sortLatestFirst, sortAlphabetically, sortStatuses } from "../utils/sortUtils";
import StatusSummary from "../components/StatusSummary";
import { isTaskLocked, getLockedReason } from "../utils/lockUtils";
import Pagination from "../components/Pagination";

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
  const [lockedMsg, setLockedMsg] = useState(""); // popup message for locked tasks

  // Filters
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchStory, setSearchStory] = useState("");

  // Debounced search
  const [debouncedStory] = useDebounce(searchStory, 350);

  // Pagination
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("TaskList_currentPage");
    return saved ? parseInt(saved) : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = sessionStorage.getItem("TaskList_itemsPerPage");
    return saved ? parseInt(saved) : 5;
  });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load filters from URL
  useEffect(() => {

    let project = searchParams.get("project");
    if (!project) {
      project = localStorage.getItem("selectedProjectId") || "";
      if (project) {
        updateURL("project", project);
      }
    } else {
      localStorage.setItem("selectedProjectId", project);
    }
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

  useEffect(() => {
    sessionStorage.setItem("TaskList_currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem("TaskList_itemsPerPage", itemsPerPage);
  }, [itemsPerPage]);

  const updateURL = (key, value) => {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    setSearchParams(searchParams);
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects", { withCredentials: true });
      setProjects(sortLatestFirst(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await api.get("/getstatusForTask", { withCredentials: true });
      setStatuses(sortStatuses(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeatures = async (projectId) => {
    try {
      const res = await api.get(`/features/project/${projectId}`, { withCredentials: true });
      setFeatures(sortLatestFirst(res.data));
    } catch {
      setFeatures([]);
    }
  };

  const fetchSprints = async (projectId) => {
    try {
      const res = await api.get(`/project/sprints/${projectId}`, { withCredentials: true });
      setSprints(sortLatestFirst(res.data));
    } catch {
      setSprints([]);
    }
  };

  const fetchUsers = async (projectId) => {
    try {
      const res = await api.get(`/project/users/${projectId}`, { withCredentials: true });
      setUsers(sortAlphabetically(res.data));
    } catch {
      setUsers([]);
    }
  };

  const fetchTasks = async (projectId) => {
    setLoading(true);
    try {
      const res = await api.get(`/viewTaskByProjectId/${projectId}`, { withCredentials: true });
      setTasks(sortLatestFirst(res.data));
      setCurrentPage(1);
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
      localStorage.setItem("selectedProjectId", projectId);
    } else {
      localStorage.removeItem("selectedProjectId");
    }

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

  const handleStatusChange = async (task, newStatusId) => {
    if (!window.confirm("Are you sure you want to change the status?")) return;
    try {
      await api.put(`/tasks/${task.id}/status/${newStatusId}`, null, { withCredentials: true });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, taskStatus: statuses.find(s => s.id === parseInt(newStatusId)) } : t
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
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
  const indexOfLastTask = currentPage * itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfLastTask - itemsPerPage, indexOfLastTask);

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

<div className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
    <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Tasks</h2>

    <div style={{ minWidth: '220px' }}>
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
        menuPortalTarget={document.body}
        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
      />
    </div>
    
    <StatusSummary data={filteredTasks} statusExtractor={(task) => task.taskStatus?.decription || task.taskStatus?.description || task.status || ''} />
  </div>

  <div className="header-actions" style={{ flexShrink: 0, display: 'flex', gap: '10px' }}>
    <button className="icon-download-btn" onClick={downloadExcel} title="Download Excel">
      <FaDownload />
    </button>
    <button className="create-btn" onClick={() => navigate("/create-task")} style={{ whiteSpace: 'nowrap' }}>
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
              <th style={{ whiteSpace: 'nowrap' }}>Project Name</th>
              <th style={{ whiteSpace: 'nowrap' }}>
                Feature Name
                <br />
                <select
                  value={selectedFeature}
                  onChange={(e) => {
                    setSelectedFeature(e.target.value);
                    updateURL("feature", e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: selectedFeature ? '#16a34a' : '#fff',
                    color: selectedFeature ? '#fff' : '#333',
                    borderColor: selectedFeature ? '#16a34a' : '#ccc',
                    fontWeight: selectedFeature ? 'bold' : 'normal',
                  }}
                >
                  <option value="">All</option>
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>
                Sprint
                <br />
                <select
                  value={selectedSprint}
                  onChange={(e) => {
                    setSelectedSprint(e.target.value);
                    updateURL("sprint", e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: selectedSprint ? '#16a34a' : '#fff',
                    color: selectedSprint ? '#fff' : '#333',
                    borderColor: selectedSprint ? '#16a34a' : '#ccc',
                    fontWeight: selectedSprint ? 'bold' : 'normal',
                  }}
                >
                  <option value="">All</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>ID</th>
              <th>Task Name</th>
              <th style={{ whiteSpace: 'nowrap' }}>
                Status
                <br />
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    updateURL("status", e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: selectedStatus ? '#16a34a' : '#fff',
                    color: selectedStatus ? '#fff' : '#333',
                    borderColor: selectedStatus ? '#16a34a' : '#ccc',
                    fontWeight: selectedStatus ? 'bold' : 'normal',
                  }}
                >
                  <option value="">All</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.decription}</option>
                  ))}
                </select>
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>
                User
                <br />
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    updateURL("user", e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: selectedUser ? '#16a34a' : '#fff',
                    color: selectedUser ? '#fff' : '#333',
                    borderColor: selectedUser ? '#16a34a' : '#ccc',
                    fontWeight: selectedUser ? 'bold' : 'normal',
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
              <th style={{ whiteSpace: 'nowrap' }}>Start Date</th>
              <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
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
                  <td className="ellipsis-cell" title={projects.find(p => p.id === parseInt(selectedProject))?.name || "-"}>{projects.find(p => p.id === parseInt(selectedProject))?.name || "-"}</td>
                  <td className="ellipsis-cell" title={task.feature?.name || "-"}>{task.feature?.name || "-"}</td>
                  <td className="ellipsis-cell" title={task.sprint?.name || "-"}>{task.sprint?.name || "-"}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{task.id}</td>
                  <td className="ellipsis-cell" title={task.userstory}>
                    {task.userstory || "-"}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <select
                      value={task.taskStatus?.id || ""}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.decription || s.description || s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{task.user?.first_name || "-"}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div className="action-buttons">
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => navigate(`/task/${task.id}`)}>
                          <FaEye />
                        </button>
                        <span className="tooltip-text">View Task</span>
                      </div>
                      <div className="tooltip">
                        <button
                          className="icon-btn"
                          title={isTaskLocked(task) ? 'Locked — cannot edit completed Sprint/Feature/Project' : 'Edit Task'}
                          onClick={() => {
                            if (isTaskLocked(task)) { setLockedMsg(getLockedReason(task)); return; }
                            navigate(`/edit-task/${task.id}`);
                          }}
                          style={isTaskLocked(task) ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          {isTaskLocked(task) ? <FaLock /> : <FaEdit />}
                        </button>
                        <span className="tooltip-text">{isTaskLocked(task) ? 'Locked' : 'Edit Task'}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

        {selectedProject && filteredTasks.length > 0 && (
          <Pagination
            totalItems={filteredTasks.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}

        {/* 🔒 Locked Task Popup */}
        {lockedMsg && (
          <div className="popup-overlay" style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="popup-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#dc2626', fontSize: '32px', marginBottom: '10px' }}>
                <FaLock />
              </div>
              <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Task Locked</h3>
              <p style={{ color: '#4b5563', whiteSpace: 'pre-line', marginBottom: '20px', lineHeight: '1.5' }}>
                {lockedMsg}
              </p>
              <button 
                onClick={() => setLockedMsg("")} 
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                OK
              </button>
            </div>
          </div>
        )}

      </div>

    </div>

  );

}