import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '../api';
import "./SprintOverview.css";

export default function SprintOverview({ sprintId: propSprintId }) {
  const { sprintId: paramSprintId } = useParams();
  const sprintId = propSprintId || paramSprintId;

  const [sprint, setSprint] = useState(null);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
   const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Add this state at the top
const [allSprints, setAllSprints] = useState([]);

// Fetch all sprints in fetchData or a separate useEffect
useEffect(() => {
  const fetchAllSprints = async () => {
    try {
      const res = await api.get(
        `/sprints`,
        { withCredentials: true }
      );
      setAllSprints(res.data);
    } catch (err) {
      console.error("Error fetching all sprints:", err);
    }
  };
  fetchAllSprints();
}, []);

  useEffect(() => {
    if (!sprintId) return;
    fetchData();
  }, [sprintId]);

  const fetchData = async () => {
    try {
      const sprintRes = await api.get(
        `/sprints/${sprintId}`,
        { withCredentials: true }
      );
      setSprint(sprintRes.data);

      const usersRes = await api.get(
        `/sprint/users/${sprintId}`,
        { withCredentials: true }
      );
      setUsers(usersRes.data);

      const ManagerRes = await api.get(
        `/users`,
        { withCredentials: true }
      );
      setManagers(ManagerRes.data);

      const tasksRes = await api.get(
        `/sprint/viewtaskBySprintId/${sprintId}`,
        { withCredentials: true }
      );
      const todo = tasksRes.data.filter(
        (t) => t.taskStatus?.decription === "To Do"
      );
      const inProgress = tasksRes.data.filter(
        (t) => t.taskStatus?.decription === "In Progress"
      );
      const done = tasksRes.data.filter(
        (t) => t.taskStatus?.decription === "Done"
      );
      setTasks({ todo, inProgress, done });
    } catch (err) {
      console.error("Error fetching sprint data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Assign Task API call
  // Inside your SprintOverview.jsx

// Move Task API
const handleMoveTask = async (taskId, nextSprintId) => {
  if (!window.confirm("Are you sure you want to move this task to another sprint?")) return;

  try {
    await api.put(
      `/tasks/${taskId}/move/${nextSprintId}`,
      {},
      { withCredentials: true }
    );
    fetchData(); // refresh data
  } catch (err) {
    console.error("Error moving task:", err);
  }
};

// Update handleAssign & handleAssignReport with confirmation
const handleAssign = async (taskId, userId) => {
  if (!window.confirm("Are you sure you want to assign this task?")) return;

  try {
    await api.put(
      `/tasks/${taskId}/assignTo/${userId}`,
      {},
      { withCredentials: true }
    );
    fetchData();
  } catch (err) {
    console.error("Error assigning task:", err);
  }
};

const handleAssignReport = async (taskId, managerId) => {
  if (!window.confirm("Are you sure you want to assign this report-to?")) return;

  try {
    await api.put(
      `/tasks/${taskId}/assignReportTo/${managerId}`,
      {},
      { withCredentials: true }
    );
    fetchData();
  } catch (err) {
    console.error("Error assigning report-to:", err);
  }
};
useEffect(() => {
    // Fetch all available statuses
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
      fetchData(); // refresh tasks
    })
    .catch((err) => console.error("Error updating status:", err));
};


  if (loading) return <div className="loading">Loading Sprint Overview...</div>;

  return (
    <div className="sprint-overview">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      {/* Sprint Header */}
      <div className="sprint-header">
        <h2>
          {sprint.name} (ID: {sprint.id})
        </h2>
        <p>
          Start: {sprint.startDate} | End: {sprint.endDate} | Duration:{" "}
          {Math.ceil(
            (new Date(sprint.endDate) - new Date(sprint.startDate)) /
              (1000 * 60 * 60 * 24)
          )}{" "}
          days
        </p>
        <p>
          Status: {sprint.status} | Targeted SP: {sprint.targetedSP} | Achieved
          SP: {sprint.achievedSP}
        </p>
      </div>

      {/* Users Section 
      <div className="users-section">
        <h3>Users</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Achieved SP</th>
              <th>Remaining SP</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.preffered_name || u.name}</td>
                <td>{u.achievedSP}</td>
                <td>{u.remainingSP}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      */}

      {/* Tasks Section */}
      <div className="tasks-section">
        {["todo", "inProgress", "done"].map((statusKey) => {
          const statusTitle =
            statusKey === "todo"
              ? "To Do"
              : statusKey === "inProgress"
              ? "In Progress"
              : "Done";
          return (
            <div key={statusKey} className="task-table">
              <h3>{statusTitle}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                     <th>Status</th>
                    <th>Story Points</th>
                    <th>Report To</th>
                    <th>Move Sprint</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks[statusKey].map((task) => (
                    <tr key={task.id}>
                      <td>{task.userstory}</td>

                      {/* Assignee dropdown (always available) */}
                      <td>
                        <select
                          onChange={(e) =>
                            handleAssign(task.id, e.target.value)
                          }
                          value={task.user?.id || ""}
                        >
                          <option value="" disabled>
                            Assign to...
                          </option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.preffered_name || u.name}
                            </option>
                          ))}
                        </select>
                      </td>

                     
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

                      {/* Story points */}
                      <td>{task.storypoints}</td>

                      {/* Report To dropdown */}
                      <td>
                        <select
                          onChange={(e) =>
                            handleAssignReport(task.id, e.target.value)
                          }
                          value={task.reportedTo?.id || ""}
                        >
                          <option value="" disabled>
                            Report to...
                          </option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.preffered_name || m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    <td>
                      <select
                        onChange={(e) => handleMoveTask(task.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Move to sprint...</option>
                        {allSprints
                          .filter(s => s.id !== sprint.id)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                    </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
