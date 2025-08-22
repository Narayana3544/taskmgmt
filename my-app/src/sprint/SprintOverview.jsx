import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./SprintOverview.css";

export default function SprintOverview({ sprintId: propSprintId }) {
  const { sprintId: paramSprintId } = useParams(); // get from URL if available
  const sprintId = propSprintId || paramSprintId;

  const [sprint, setSprint] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sprintId) return; // don't fetch if sprintId undefined

    const fetchData = async () => {
      try {
        // Sprint Details
        const sprintRes = await axios.get(
          `http://localhost:8080/api/sprints/${sprintId}`,
          { withCredentials: true }
        );
        setSprint(sprintRes.data);

        // Sprint Users
        const usersRes = await axios.get(
          `http://localhost:8080/api/sprints/${sprintId}/users`,
          { withCredentials: true }
        );
        setUsers(usersRes.data);

        // Sprint Tasks
        const tasksRes = await axios.get(
          `http://localhost:8080/api/sprints/${sprintId}/tasks`,
          { withCredentials: true }
        );

        const todo = tasksRes.data.filter((t) => t.status === "To Do");
        const inProgress = tasksRes.data.filter((t) => t.status === "In Progress");
        const done = tasksRes.data.filter((t) => t.status === "Done");

        setTasks({ todo, inProgress, done });
      } catch (error) {
        console.error("Error fetching sprint data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sprintId]);

  if (!sprintId) return <div className="loading">No Sprint ID provided</div>;
  if (loading) return <div className="loading">Loading Sprint Overview...</div>;
  if (!sprint) return <div className="loading">Sprint not found</div>;

  return (
    <div className="sprint-overview">
      {/* Sprint Header */}
      <div className="sprint-header">
        <h2>{sprint.name || `Sprint ${sprint.id}`} (ID: {sprint.id})</h2>
        <p>
          Start: {sprint.startDate || "-"} | End: {sprint.endDate || "-"} | Duration: {sprint.duration || "-"} days
        </p>
        <p>
          Status: {sprint.status || "-"} | Targeted SP: {sprint.targetedSP || 0} | Achieved SP: {sprint.achievedSP || 0}
        </p>
        <div className="sp-progress">
          <div
            className="sp-progress-bar"
            style={{ width: `${(sprint.achievedSP / sprint.targetedSP) * 100 || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Users Section */}
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
            {users.length ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.preffed_name || user.name || "-"}</td>
                  <td>{user.achievedSP || 0}</td>
                  <td>{user.remainingSP || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No users assigned
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        {["todo", "inProgress", "done"].map((statusKey) => {
          const statusTitle =
            statusKey === "todo" ? "To Do" : statusKey === "inProgress" ? "In Progress" : "Done";
          return (
            <div key={statusKey} className="task-table">
              <h3>{statusTitle}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Story Points</th>
                    <th>Reported By</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks[statusKey].length ? (
                    tasks[statusKey].map((task) => (
                      <tr key={task.id}>
                        <td>{task.userstory || task.name || "-"}</td>
                        <td>{task.assignee || "-"}</td>
                        <td>{task.storyPoints || 0}</td>
                        <td>{task.reportedBy || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        No tasks
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
