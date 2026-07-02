import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { differenceInDays, addDays, format, isBefore, isSameDay } from "date-fns";
import { sortAlphabetically, sortLatestFirst } from "../utils/sortUtils";
import "./SprintOverview.css";

export default function SprintOverview({ sprintId: propSprintId }) {
  const { sprintId: paramSprintId } = useParams();
  const sprintId = propSprintId || paramSprintId;

  const [sprint, setSprint] = useState(null);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [bugs, setBugs] = useState({ todo: [], inProgress: [], done: [] });
  const [filterAssignee, setFilterAssignee] = useState("All");
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
      setAllSprints(sortLatestFirst(res.data));
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
      setUsers(sortAlphabetically(usersRes.data));

      const ManagerRes = await api.get(
         `/users`,
        { withCredentials: true }
      );
      setManagers(sortAlphabetically(ManagerRes.data));

      const tasksRes = await api.get(
        `/sprint/viewtaskBySprintId/${sprintId}`,
        { withCredentials: true }
      );
      const sortedTasks = sortLatestFirst(tasksRes.data);
      const todo = sortedTasks.filter(
        (t) => t.taskStatus?.decription === "To Do"
      );
      const inProgress = sortedTasks.filter(
        (t) => t.taskStatus?.decription === "In Progress"
      );
      const done = sortedTasks.filter(
        (t) => t.taskStatus?.decription === "Done"
      );
      setTasks({ todo, inProgress, done });

      const bugsRes = await api.get(
        `/sprints/${sprintId}/bugs`,
        { withCredentials: true }
      );
      
      const sortedBugs = sortLatestFirst(bugsRes.data);
      const bugTodo = sortedBugs.filter(
        (b) => b.status?.description === "To Do" || b.status?.description === "Open"
      );
      const bugInProgress = sortedBugs.filter(
        (b) => b.status?.description === "In Progress"
      );
      const bugDone = sortedBugs.filter(
        (b) => b.status?.description === "Done" || b.status?.description === "Closed"
      );
      setBugs({ todo: bugTodo, inProgress: bugInProgress, done: bugDone });

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

  const handleBugStatusChange = (bugId, statusId) => {
    api
      .put(
        `/bugs/${bugId}/status/${statusId}`,
        {},
        { withCredentials: true }
      )
      .then(() => fetchData())
      .catch((err) => console.error("Error updating bug status:", err));
  };

  const handleCloseSprint = async () => {
    // Validation: Check if any task or bug is NOT 'Done' / 'Closed'
    const hasOpenTasks = [...tasks.todo, ...tasks.inProgress].length > 0;
    const hasOpenBugs = [...bugs.todo, ...bugs.inProgress].length > 0;

    if (hasOpenTasks || hasOpenBugs) {
      alert("Task status must be done.");
      return;
    }

    if (window.confirm("Are you sure you want to close this sprint?")) {
      try {
        await api.patch(`/sprints/${sprintId}/complete`, {}, { withCredentials: true });
        alert("Sprint closed successfully!");
        fetchData();
      } catch (err) {
        console.error("Error closing sprint:", err);
        alert("Failed to close sprint.");
      }
    }
  };

  if (loading) return <div className="loading">Loading Sprint Overview...</div>;

  // Compute day-by-day burndown chart data
  const generateBurndownData = () => {
    if (!sprint || !sprint.startDate || !sprint.endDate) return [];
    
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const totalDays = differenceInDays(end, start) + 1;
    
    const allTasks = [...tasks.todo, ...tasks.inProgress, ...tasks.done];
    const filteredTasks = filterAssignee === "All" 
        ? allTasks 
        : allTasks.filter(t => t.user?.id.toString() === filterAssignee);
        
    const totalSP = filteredTasks.reduce((sum, t) => sum + (t.storypoints || 0), 0);
    
    let chartData = [];
    let currentRemaining = totalSP;
    
    for (let i = 0; i < totalDays; i++) {
        const currentDate = addDays(start, i);
        
        // Ideal burndown drops uniformly
        const idealRemaining = totalSP - ((totalSP / (totalDays - 1 || 1)) * i);
        
        // Subtract SP of tasks that are "Done" and whose end_date is <= currentDate
        const tasksCompletedOnThisDay = filteredTasks.filter(t => {
            if (t.taskStatus?.decription !== "Done") return false;
            const taskEndDate = t.end_date ? new Date(t.end_date) : start; 
            return isSameDay(taskEndDate, currentDate);
        });
        
        const spCompletedToday = tasksCompletedOnThisDay.reduce((sum, t) => sum + (t.storypoints || 0), 0);
        currentRemaining -= spCompletedToday;
        
        // Plot actual up to today
        const isFuture = isBefore(new Date(), currentDate) && !isSameDay(new Date(), currentDate);
        
        chartData.push({
            name: format(currentDate, 'MMM dd'),
            Ideal: parseFloat(Math.max(0, idealRemaining).toFixed(1)),
            Actual: isFuture ? null : currentRemaining
        });
    }
    
    return chartData;
  };

  const chartData = generateBurndownData();

  return (
    <div className="sprint-overview">

      {/* Sprint Header */}
      <div className="sprint-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>
            {sprint.name} (ID: {sprint.id})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate(-1)}
              className="btn-global btn-secondary"
              style={{ margin: 0 }}
            >
              Back
            </button>
            {sprint.status?.toLowerCase() !== 'completed' && sprint.status?.toLowerCase() !== 'closed' && (
              <button 
                onClick={handleCloseSprint}
                className="btn-global btn-primary"
                style={{ margin: 0 }}
              >
                Close Sprint
              </button>
            )}
          </div>
        </div>
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
      {sprint.sprintGoals && (
        <div className="sprint-goals-block">
          <h4>Sprint Goals</h4>
          <p>{sprint.sprintGoals}</p>
        </div>
      )}

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

      {/* Burndown Chart Section */}
      <div className="burndown-chart-section" style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Sprint Burndown (Story Points)</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '10px' }}>Filter by Assignee:</label>
          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={{ padding: '5px' }}>
            <option value="All">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.preffered_name || u.name || u.first_name}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Ideal" stroke="#82ca9d" strokeWidth={2} dot={false} />
            <Line type="stepAfter" dataKey="Actual" stroke="#8884d8" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

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
                  {/* Bugs rendering */}
                  {bugs[statusKey] && bugs[statusKey].map((bug) => (
                    <tr key={`bug-${bug.id}`} style={{ backgroundColor: '#fff0f0' }}>
                      <td><strong>[BUG]</strong> {bug.title}</td>

                      {/* Assignee - readonly for bugs in this view or use bug assignedTo */}
                      <td>
                        <span style={{ color: '#555' }}>{bug.assignedUser?.first_name || "-"}</span>
                      </td>

                      {/* Bug Status dropdown */}
                      <td>
                        <select
                          value={bug.status?.id || ""}
                          onChange={(e) => handleBugStatusChange(bug.id, e.target.value)}
                        >
                          <option value="">-- Select Status --</option>
                          {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.decription || status.description}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Story points column repurposed for priority */}
                      <td><span className="priority-badge">{bug.priority?.description || "-"}</span></td>

                      {/* Reporter */}
                      <td>
                        <span style={{ color: '#555' }}>{bug.reportedUser?.first_name || "-"}</span>
                      </td>

                      {/* Move sprint (not applicable for bugs directly) */}
                      <td>-</td>
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
