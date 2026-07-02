import React, { useEffect, useState } from "react";
import api from '../api';
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa"; // 👁️ View icon
import "./AssignedTasks.css";

export default function AssignedTasks() {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
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
  }, [selectedSprint, selectedStatus]);

  const handleStatusChange = (taskId, statusId) => {
    api
      .put(`/tasks/${taskId}/status/${statusId}`, {}, { withCredentials: true })
      .then(() => {
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId
              ? { ...task, taskStatus: statuses.find(s => s.id === parseInt(statusId)) }
              : task
          )
        );
      })
      .catch(err => console.error("Error updating status:", err));
  };

  // Pagination Logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="assigned-tasks-page">
      <h2>My Tasks</h2>

      <div className="table-wrapper">
        <table className="task-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Story</th>
              <th>Story Points</th>
              <th>
                Sprint
                <div>
                  <select
                    className="column-filter"
                    value={selectedSprint}
                    onChange={(e) => setSelectedSprint(e.target.value)}
                  >
                    <option value="">All</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th>Feature</th>
              <th>Task Type</th>
              <th>
                Status
                <div>
                  <select
                    className="column-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.decription}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th>Start Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTasks.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>No tasks found.</td>
              </tr>
            )}
            {currentTasks.map(task => (
              <tr key={task.id}>
                <td >{task.id}</td>
                <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={task.userstory}>
                  {task.userstory || "-"}
                </td>
                <td>{task.storypoints ?? "-"}</td>
                <td>{task.sprint?.name || "-"}</td>
                <td>{task.feature?.name || "-"}</td>
                <td>{task.taskType?.description || "-"}</td>
                <td>
                  <select
                    value={task.taskStatus?.id || ""}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>{status.decription}</option>
                    ))}
                  </select>
                </td>
                <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>

                {/* 👁️ View icon with tooltip */}
                <td>
                  <div className="icon-tooltip">
                    <FaEye
                      className="view-icon"
                      onClick={() => navigate(`/task/${task.id}`)}
                    />
                    <span className="tooltip-text">View Task</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length > tasksPerPage && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(num => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={currentPage === num ? "active" : ""}
            >
              {num}
            </button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </button>
          <span className="page-info">Page {currentPage} of {totalPages}</span>
        </div>
      )}
    </div>
  );
}