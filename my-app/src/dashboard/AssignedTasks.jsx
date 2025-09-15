import React, { useEffect, useState } from "react";
import api from '../api';
import { useNavigate } from "react-router-dom";
import "./AssignedTasks.css";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(5); // 👈 change this to increase/decrease rows per page
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch tasks
    api
      .get(`/user/tasks`, { withCredentials: true })
      .then((res) => {
        setTasks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks.");
        setLoading(false);
      });

    // Fetch statuses
    api
      .get(`/getstatusForTask`, { withCredentials: true })
      .then((res) => setStatuses(res.data))
      .catch((err) => console.error("Error fetching statuses:", err));
  }, []);

  const handleStatusChange = (taskId, statusId) => {
    api
      .put(
        `/tasks/${taskId}/status/${statusId}`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, taskStatus: statuses.find((s) => s.id === parseInt(statusId)) }
              : task
          )
        );
      })
      .catch((err) => console.error("Error updating status:", err));
  };

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="features-list-page">
      <div className="task-table-container">
        <h2>Your Assigned Tasks</h2>

        <div className="table-wrapper">
          <table className="task-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Story</th>
                <th>Story Points</th>
                <th>Sprint</th>
                <th>Feature</th>
                <th>Task Type</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No tasks found.
                  </td>
                </tr>
              )}
              {currentTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.userstory || "-"}</td>
                  <td>{task.storypoints ?? "-"}</td>
                  <td>
                    {task.sprint?.sprintName || task.sprint?.name || "-"} ({task.sprint?.status})
                  </td>
                  <td>{task.feature?.name || "-"}</td>
                  <td>{task.taskType?.description || "-"}</td>
                  <td>
                    <select
                      value={task.taskStatus?.id || ""}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      <option value="">-- Select Status --</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.decription}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}
                  </td>
                  <td>
                    <button className="view-btn" onClick={() => navigate(`/task/${task.id}`)}>
                      View
                    </button>
                    {/* <button className="edit-btn" onClick={() => navigate(`/edit-task/${task.id}`)}>
                      <FaEdit />
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {tasks.length > tasksPerPage && (
          <div className="pagination">
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
  >
    Previous
  </button>

  {/* Show limited page numbers */}
  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
    .filter(
      (num) =>
        num === 1 || // always show first
        num === totalPages || // always show last
        (num >= currentPage - 2 && num <= currentPage + 2) // show around current
    )
    .map((num, idx, arr) => {
      // Add "..." where numbers are skipped
      if (idx > 0 && arr[idx] - arr[idx - 1] > 1) {
        return (
          <span key={`dots-${num}`} className="dots">
            ...
          </span>
        );
      }
      return (
        <button
          key={num}
          onClick={() => setCurrentPage(num)}
          className={currentPage === num ? "active" : ""}
        >
          {num}
        </button>
      );
    })}

  <button
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
  >
    Next
  </button>

  {/* Page info */}
  <span className="page-info">
    Page {currentPage} of {totalPages}
  </span>
</div>
        )}
      </div>
    </div>
  );
}
