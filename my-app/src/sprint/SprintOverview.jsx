import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import axios from "axios";
import "./SprintOverview.css";

export default function SprintOverview({ sprintId: propSprintId }) {
  const { sprintId: paramSprintId } = useParams();
  const sprintId = propSprintId || paramSprintId;

  const [sprint, setSprint] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const navigate=useNavigate();

  useEffect(() => {
    if (!sprintId) return;
    fetchData();
  }, [sprintId]);

  const fetchData = async () => {
    try {
      const sprintRes = await axios.get(`http://localhost:8080/api/sprints/${sprintId}`, { withCredentials: true });
      setSprint(sprintRes.data);

      const usersRes = await axios.get(`http://localhost:8080/api/sprint/users/${sprintId}`, { withCredentials: true });
      setUsers(usersRes.data);

      const ManagerRes=await axios.get(`http://localhost:8080/api/managers`,{withCredentials:true})
       setManagers(ManagerRes.data)
      // .catch(err => console.error("Error fetching managers", err));
      console.log(ManagerRes.data);

      const tasksRes = await axios.get(`http://localhost:8080/api/sprint/viewtaskBySprintId/${sprintId}`, { withCredentials: true });
      const todo = tasksRes.data.filter((t) => t.taskStatus?.decription === "To Do");
      const inProgress = tasksRes.data.filter((t) => t.taskStatus?.decription === "In Progress");
      const done = tasksRes.data.filter((t) => t.taskStatus?.decription === "Done");
      setTasks({ todo, inProgress, done });
    } catch (err) {
      console.error("Error fetching sprint data:", err);
    } finally {
      setLoading(false);
    }
    
  };

  // Assign Task API call
  const handleAssign = async (taskId, userId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/tasks/${taskId}/assignTo/${userId}`,
        {},
        { withCredentials: true }
      );
      fetchData(); // refresh data
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  const handleAssignReport = async (taskId, managerId) => {
  try {
    await axios.put(`http://localhost:8080/api/tasks/${taskId}/assignReportTo/${managerId}`,
      {},
        { withCredentials: true }
    );
    // refresh tasks list after assignment
    fetchData();
  } catch (err) {
    console.error("Error assigning report-to:", err);
  }
};

  if (loading) return <div className="loading">Loading Sprint Overview...</div>;

  return (
    <div className="sprint-overview">
       <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
      {/* Sprint Header */}
      <div className="sprint-header">
        <h2>{sprint.name} (ID: {sprint.id})</h2>
        <p>
          Start: {sprint.startDate} | End: {sprint.endDate} | 
        Duration:{" "}
          {Math.ceil(
            (new Date(sprint.endDate) - new Date(sprint.startDate)) /
              (1000 * 60 * 60 * 24)
          )}{" "}
          days
        </p>
        <p>
          Status: {sprint.status} | Targeted SP: {sprint.targetedSP} | Achieved SP: {sprint.achievedSP}
        </p>
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
                     <th>Reporter</th>
                    <th>Story Points</th>
                    <th>Report To</th>
                    {statusKey === "todo" && <th>Assign</th>}
                  </tr>
                </thead>
                <tbody>
                  {tasks[statusKey].map((task) => (
                    <tr key={task.id}>
                      <td>{task.userstory}</td>
                      <td>{task.user?.first_name  || "Unassigned"}</td>
                      <td>{task.reportedTo ?.first_name  || "Unassigned"}</td>
                      <td>{task.storypoints}</td>
                      {(!task.reportedTo || task.reportedTo === null) && (
                      <td>
                        <select
                          onChange={(e) => handleAssignReport(task.id, e.target.value)}
                          defaultValue=""
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
                    )}
                      { (!task.user || task.user.id === null) && (
                        <td>
                          <select
                            onChange={(e) => handleAssign(task.id, e.target.value)}
                            defaultValue=""
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
                      )}
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
