import React, { useEffect, useState } from "react";
import api from '../api';
import { useNavigate } from "react-router-dom";
import { FaEye, FaLock } from "react-icons/fa";
import StatusSummary from "../components/StatusSummary";
import { isTaskLocked, getLockedReason } from "../utils/lockUtils";
import "./AssignedTasks.css";

export default function AssignedTasks() {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lockedMsg, setLockedMsg] = useState(""); // popup message for locked tasks

  // Filters
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const tasksPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    fetchSprints();
    fetchStatuses();
  }, []);

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
      setStatuses(res.data);
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSprint) params.sprintId = selectedSprint;
      if (selectedStatus) params.statusId = selectedStatus;

      const res = await api.get("/user/tasks", { params, withCredentials: true });
      setTasks(res.data);
      setCurrentPage(0);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedSprint, selectedStatus]);

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
  const indexOfLastTask = (currentPage + 1) * tasksPerPage;
  const currentTasks = tasks.slice(indexOfLastTask - tasksPerPage, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  return (
    <div className="assigned-tasks-page">

      {/* ── HEADER BAR (same layout as TaskList) ── */}
      <div className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
          <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>My Tasks</h2>

          {/* Sprint filter dropdown in header */}
          <select
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', fontSize: '14px', cursor: 'pointer', minWidth: '180px' }}
          >
            <option value="">All Sprints</option>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <StatusSummary
            data={tasks}
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
              <th>Project Name</th>
              <th>Feature Name</th>
              <th>Sprint</th>
              <th>Task Name</th>
              <th style={{ whiteSpace: 'nowrap' }}>ID</th>
              <th>User</th>
              <th style={{ whiteSpace: 'nowrap' }}>
                Status
                <br />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">All</option>
                  {statuses.map(s => (
                    <option key={s.id} value={s.id}>{s.decription}</option>
                  ))}
                </select>
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>Start Date</th>
              <th>Actions</th>
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
                  <td>{task.feature?.project?.name || "-"}</td>
                  <td>{task.feature?.name || "-"}</td>
                  <td>{task.sprint?.name || "-"}</td>
                  <td
                    style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={task.userstory}
                  >
                    {task.userstory || "-"}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{task.id}</td>
                  <td>{task.user?.first_name || task.user?.name || "-"}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <select
                      value={task.taskStatus?.id || ""}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      {statuses.map(status => (
                        <option key={status.id} value={status.id}>
                          {status.decription || status.description || status.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => navigate(`/task/${task.id}`)}>
                          <FaEye />
                        </button>
                        <span className="tooltip-text">View Task</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

        {/* ── PAGINATION (same as TaskList) ── */}
        {totalPages > 1 && (
          <div className="pagination">

            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
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
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </button>

          </div>
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