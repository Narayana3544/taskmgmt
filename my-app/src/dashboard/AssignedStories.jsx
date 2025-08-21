import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./AssignedStories.css";
import { FaEdit } from "react-icons/fa";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]); // <-- store all statuses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch tasks
    axios
      .get(`http://localhost:8080/api/user/tasks`, { withCredentials: true })
      .then((res) => {
        setTasks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks.");
        setLoading(false);
      });

    // Fetch all available statuses
    axios
      .get(`http://localhost:8080/api/getstatus`, { withCredentials: true })
      .then((res) => setStatuses(res.data))
      .catch((err) => console.error("Error fetching statuses:", err));
  }, []);

  const handleStatusChange = (taskId, statusId) => {
    axios
      .put(
        `http://localhost:8080/api/tasks/${taskId}/status/${statusId}`,
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

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="features-list-page">
      <div className="task-table-container">
        <h2>Task List</h2>

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
              {tasks.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No tasks found.
                  </td>
                </tr>
              )}
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.userstory || "-"}</td>
                  <td>{task.storypoints ?? "-"}</td>
                  <td>{task.sprint?.sprintName || task.sprint?.name || "-"}</td>
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
                  <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>
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
      </div>
    </div>
  );
}
