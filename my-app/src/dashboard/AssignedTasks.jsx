import React, { useEffect, useState } from "react";
import api from '../api';
import { useNavigate } from "react-router-dom";
import { FaEye, FaLock, FaEdit } from "react-icons/fa";
import StatusSummary from "../components/StatusSummary";
import { isTaskLocked, getLockedReason } from "../utils/lockUtils";
import Pagination from "../components/Pagination";
import { sortStatuses } from "../utils/sortUtils";
import "./AssignedTasks.css";

export default function AssignedTasks() {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lockedMsg, setLockedMsg] = useState(""); // popup message for locked tasks
  const [userProfile, setUserProfile] = useState(null);

  // Filters
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("AssignedTasks_currentPage");
    return saved ? parseInt(saved) : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = sessionStorage.getItem("AssignedTasks_itemsPerPage");
    return saved ? parseInt(saved) : 5;
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchSprints();
    fetchStatuses();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/user/profile', { withCredentials: true });
      setUserProfile(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSprints = async () => {
    try {
      const res = await api.get("/sprintsforUser", { withCredentials: true });
      setSprints(res.data);
    } catch (err) {
      console.error("Error fetching sprints:", err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await api.get("/getstatusForTask", { withCredentials: true });
      setStatuses(sortStatuses(res.data));
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/tasks", { withCredentials: true });
      setTasks(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("AssignedTasks_currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem("AssignedTasks_itemsPerPage", itemsPerPage);
  }, [itemsPerPage]);

  const allowedTasks = React.useMemo(() => {
    const isAdmin = userProfile?.role?.description === 'Admin';
    if (isAdmin) return tasks;
    return tasks.filter(t => {
      const assignedUserId = t.user?.id || t.assignedUser?.id || t.assignedTo?.id;
      return assignedUserId === userProfile?.id;
    });
  }, [tasks, userProfile]);

  const uniqueProjects = Array.from(new Set(allowedTasks.map(t => t.feature?.project?.name))).filter(Boolean).sort();
  const uniqueFeatures = Array.from(new Set(allowedTasks.map(t => t.feature?.name))).filter(Boolean).sort();

  const filteredTasks = React.useMemo(() => {
    return allowedTasks.filter((t) => {
      if (selectedProject && t.feature?.project?.name !== selectedProject) return false;
      if (selectedFeature && t.feature?.name !== selectedFeature) return false;
      if (selectedSprint && String(t.sprint?.id) !== String(selectedSprint)) return false;
      if (selectedStatus && String(t.taskStatus?.id) !== String(selectedStatus)) return false;
      if (searchTitle && !t.userstory?.toLowerCase().includes(searchTitle.toLowerCase())) return false;
      return true;
    });
  }, [allowedTasks, selectedProject, selectedFeature, selectedSprint, selectedStatus, searchTitle]);

  const handleStatusChange = async (task, statusId) => {
    if (!window.confirm("Are you sure you want to change the status?")) {
      return;
    }
    try {
      await api.put(`/tasks/${task.id}/status/${statusId}`, null, { withCredentials: true });
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, taskStatus: statuses.find(s => s.id === parseInt(statusId)) }
            : t
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  // Pagination
  const indexOfLastTask = currentPage * itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfLastTask - itemsPerPage, indexOfLastTask);

  return (
    <div className="assigned-tasks-page">

      {/* ── HEADER BAR (same layout as TaskList) ── */}
      <div className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
          <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>My Tasks</h2>

          <StatusSummary
            data={filteredTasks}
            statusExtractor={(task) => task.taskStatus?.decription || task.taskStatus?.description || task.status || ''}
          />
        </div>
      </div>

      {loading && <p>Loading tasks...</p>}
      {error && <p>{error}</p>}

      {/* ── TABLE (same structure as TaskList) ── */}
      <div className="task-table-container">
        <table className="task-table">

          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>
                Project Name
                <br />
                <select
                  value={selectedProject}
                  onChange={(e) => { setSelectedProject(e.target.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: selectedProject ? '#16a34a' : '#fff',
                    color: selectedProject ? '#fff' : '#333',
                    borderColor: selectedProject ? '#16a34a' : '#ccc',
                    fontWeight: selectedProject ? 'bold' : 'normal',
                  }}
                >
                  <option value="">All</option>
                  {uniqueProjects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>
                Feature Name
                <br />
                <select
                  value={selectedFeature}
                  onChange={(e) => { setSelectedFeature(e.target.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: selectedFeature ? '#16a34a' : '#fff',
                    color: selectedFeature ? '#fff' : '#333',
                    borderColor: selectedFeature ? '#16a34a' : '#ccc',
                    fontWeight: selectedFeature ? 'bold' : 'normal',
                  }}
                >
                  <option value="">All</option>
                  {uniqueFeatures.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>
                Sprint
                <br />
                <select
                  value={selectedSprint}
                  onChange={(e) => { setSelectedSprint(e.target.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: selectedSprint ? '#16a34a' : '#fff',
                    color: selectedSprint ? '#fff' : '#333',
                    borderColor: selectedSprint ? '#16a34a' : '#ccc',
                    fontWeight: selectedSprint ? 'bold' : 'normal',
                  }}
                >
                  <option value="">All</option>
                  {sprints.map(s => (
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
                    onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                    style={{
                      backgroundColor: selectedStatus ? '#16a34a' : '#fff',
                      color: selectedStatus ? '#fff' : '#333',
                      borderColor: selectedStatus ? '#16a34a' : '#ccc',
                      fontWeight: selectedStatus ? 'bold' : 'normal',
                    }}
                  >
                  <option value="">All</option>
                  {statuses.map(s => (
                    <option key={s.id} value={s.id}>{s.decription}</option>
                  ))}
                </select>
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>User</th>
              <th style={{ whiteSpace: 'nowrap' }}>Start Date</th>
              <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="no-data">Loading tasks...</td>
              </tr>
            ) : currentTasks.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No tasks found.</td>
              </tr>
            ) : (
              currentTasks.map(task => (
                <tr key={task.id}>
                  <td className="ellipsis-cell" title={task.feature?.project?.name || "-"}>{task.feature?.project?.name || "-"}</td>
                  <td className="ellipsis-cell" title={task.feature?.name || "-"}             >{task.feature?.name || "-"}</td>
                  <td className="ellipsis-cell" title={task.sprint?.name || "-"}              >{task.sprint?.name || "-"}</td>
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
                      {statuses
                        .filter(status => {
                          // Always include the task's current status so it displays correctly
                          if (status.id === task.taskStatus?.id) return true;
                          const name = (status.decription || status.description || status.name || '').toLowerCase().trim();
                          const userRole = userProfile?.role?.description;
                          if (userRole === 'Developer') {
                            if (name.includes('re open') || name.includes('reopen') || name.includes('re-open')) return false;
                            if (name.includes('done') || name.includes('completed') || name.includes('closed') || name.includes('resolved')) return false;
                          }
                          return true;
                        })
                        .map(status => (
                        <option key={status.id} value={status.id}>
                          {status.decription || status.description || status.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{task.user?.first_name || task.user?.name || "-"}</td>
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
                          className="icon-btn edit-btn" 
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

        {/* ── PAGINATION ── */}
        {filteredTasks.length > 0 && (
          <Pagination
            totalItems={filteredTasks.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
      
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
  );
}