import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import api from "../api";
import { sortAlphabetically, sortLatestFirst } from "../utils/sortUtils";
import { isTaskLocked, getLockedReason } from "../utils/lockUtils";

const Home = () => {
  const [tasks, setTasks] = useState({ backlog: [], todo: [], inprogress: [], reopen: [], fixed: [], done: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [selectedMoveSprintId, setSelectedMoveSprintId] = useState("");
  const [sprintProgressList, setSprintProgressList] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch sprint progress (team-level)
  const fetchAllSprintProgress = async () => {
    try {
      const res = await api.get(`/user/sprint-progress`, { withCredentials: true });
      setSprintProgressList(res.data);
    } catch (err) {
      console.error("Error fetching sprint progress:", err);
    }
  };

  // ✅ Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/user/profile', { withCredentials: true });
        const user = profileRes.data;
        setUserProfile(user);
        const isAdmin = user?.role?.description === "Admin";

        // 1️⃣ Fetch Backlog Tasks (For all users: Unassigned tasks from entire system)
        let backlogItems = [];
        try {
            const [allTasksRes, allBugsRes] = await Promise.all([
              api.get("/view-tasks", { withCredentials: true }),
              api.get("/view-bugs", { withCredentials: true })
            ]);
            const allSystemTasks = [
              ...allTasksRes.data,
              ...allBugsRes.data.map(b => ({ ...b, type: 'bug', taskStatus: b.status }))
            ];
            backlogItems = allSystemTasks.filter(t => {
              const assigneeId = t.user?.id || t.assignedUser?.id;
              return !assigneeId; // Only unassigned tasks
            });
        } catch (e) {
          console.error("Error fetching backlog data:", e);
        }

        // 2️⃣ Fetch CURRENT USER'S tasks & bugs
        const myTasksRes = await api.get("/user/tasks", { withCredentials: true });
        const myBugsRes = await api.get("/user/bugs", { withCredentials: true });

        let myTasks = myTasksRes.data || [];
        if (!isAdmin && user) {
          myTasks = myTasks.filter(t => t.user?.id === user.id);
        }
        let myBugs = (myBugsRes.data || []).map((bug) => ({
          ...bug,
          type: "bug",
          title: bug.title,
          description: bug.description,
          taskStatus: bug.status,
          assignedUser: bug.assignedUser,
        }));

        // 3️⃣ Merge user tasks + bugs and sort
        const myAllTasks = sortLatestFirst([...myTasks, ...myBugs]);

        // 4️⃣ Group by status
        const grouped = { backlog: backlogItems, todo: [], inprogress: [], reopen: [], fixed: [], done: [] };
        
        myAllTasks.forEach((task) => {
          let statusStr = '';
          const statusObj = task.taskStatus || task.status;
          if (typeof statusObj === 'string') {
            statusStr = statusObj;
          } else if (statusObj) {
            statusStr = statusObj.decription || statusObj.description || statusObj.name || '';
          }
          statusStr = statusStr.trim().toLowerCase();

          const sprintStatus = (task.sprint?.status || '').toLowerCase();
          const isActiveSprint = sprintStatus === 'active';

          if (statusStr.includes('backlog')) {
            // Tasks with 'Backlog' status belong in the Backlog column
            grouped.backlog.push(task);
          } else if (statusStr.includes('re open') || statusStr.includes('reopen') || statusStr.includes('re-open')) {
            grouped.reopen.push(task);
          } else if (statusStr.includes('todo') || statusStr.includes('to do') || statusStr.includes('to-do') || statusStr.includes('open') || statusStr.includes('new') || statusStr.includes('assigned') || statusStr === '') {
            grouped.todo.push(task);
          } else if (statusStr.includes('progress') || statusStr.includes('working') || statusStr === 'active') {
            grouped.inprogress.push(task);
          } else if (statusStr.includes('fixed')) {
            grouped.fixed.push(task);
          } else if (statusStr.includes('done') || statusStr.includes('completed') || statusStr.includes('closed') || statusStr.includes('resolved')) {
            // ✅ Done: ONLY tasks from an Active Sprint (per role rules)
            if (isActiveSprint) {
              grouped.done.push(task);
            }
          }
          // Other unknown statuses are intentionally not shown in any column
        });

        setTasks(grouped);

        // 5️⃣ Fetch statuses, users, sprints
        const [statusRes, usersRes, sprintsRes] = await Promise.all([
          api.get("/getstatusForTask", { withCredentials: true }),
          api.get("/users", { withCredentials: true }),
          api.get("/sprints", { withCredentials: true }) // fetch sprints for moving
        ]);
        const getStatusOrderIndex = (s) => {
          let statusStr = (s.decription || s.description || s.name || "").toLowerCase().trim();
          if (statusStr.includes('re open') || statusStr.includes('reopen') || statusStr.includes('re-open')) return 4;
          if (statusStr.includes('backlog')) return 0;
          if (statusStr.includes('todo') || statusStr.includes('to do') || statusStr.includes('open') || statusStr.includes('new') || statusStr.includes('assigned')) return 1;
          if (statusStr.includes('progress') || statusStr.includes('working') || statusStr === 'active') return 2;
          if (statusStr.includes('fixed')) return 3;
          if (statusStr.includes('done') || statusStr.includes('completed') || statusStr.includes('closed') || statusStr.includes('resolved')) return 5;
          return 99;
        };

        const sortedStatuses = statusRes.data.sort((a, b) => getStatusOrderIndex(a) - getStatusOrderIndex(b));
        setStatuses(sortedStatuses);
        setUsers(sortAlphabetically(usersRes.data));
        setSprints(sortLatestFirst(sprintsRes.data || []));

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAllSprintProgress();
    fetchData();
  }, []);

  const toColKey = (label) => {
    const key = (label || "").toLowerCase().replace(/\s/g, "");
    return ["backlog", "todo", "inprogress", "reopen", "fixed", "done"].includes(key) ? key : "todo";
  };

  // ✅ Popup open/close
  const openPopup = (task) => {
    setSelectedTask(task);
    setSelectedUserId(task.user?.id || task.assignedUser?.id || "");
    // Pre-select the task's actual current status
    const currentStatusId = task.taskStatus?.id || task.status?.id || "";
    setSelectedStatusId(String(currentStatusId));
    setSelectedMoveSprintId("");
  };

  const closePopup = () => setSelectedTask(null);

  // ✅ Change task status
  const handleStatusChange = (taskId, statusId) => {
    if (!selectedTask) return;

    const url =
      selectedTask.type === "bug"
        ? `/bugs/${taskId}/status/${statusId}`
        : `/tasks/${taskId}/status/${statusId}`;

    api
      .put(url, {}, { withCredentials: true })
      .then(() => {
        window.location.reload();
      })
      .catch((err) => console.error("Error updating status:", err));
  };

  // ✅ Move to sprint
  const handleMoveSprint = (taskId, sprintId) => {
    if (!selectedTask) return;
    const isBug = selectedTask.type === "bug";
    const typeLabel = isBug ? "bug" : "task";
    const url = isBug ? `/bugs/${taskId}/move/${sprintId}` : `/tasks/${taskId}/move/${sprintId}`;

    if (!window.confirm(`Are you sure you want to move this ${typeLabel} to another sprint?`)) return;

    api
      .put(url, {}, { withCredentials: true })
      .then(() => {
        alert(`${isBug ? "Bug" : "Task"} moved successfully!`);
        window.location.reload();
      })
      .catch((err) => {
        console.error(`Error moving ${typeLabel}:`, err);
        alert(`Failed to move ${typeLabel}.`);
      });
  };

  const isAdmin = userProfile?.role?.description === "Admin";
  const isDeveloper = userProfile?.role?.description === "Developer";
  const columnsToRender = ["backlog", "todo", "inprogress", "fixed", "reopen", "done"];

  // Filter statuses: Developers cannot see Re-Open or Done
  const filteredStatuses = statuses.filter(s => {
    // Always include the selected task's current status so it displays correctly
    if (selectedTask && (s.id === selectedTask.taskStatus?.id || s.id === selectedTask.statusId || s.id === selectedTask.status?.id)) {
      return true;
    }
    const name = (s.decription || s.description || s.name || '').toLowerCase().trim();
    if (isDeveloper) {
      if (name.includes('re open') || name.includes('reopen') || name.includes('re-open')) return false;
      if (name.includes('done') || name.includes('completed') || name.includes('closed') || name.includes('resolved')) return false;
    }
    return true;
  });

  // Helper to check if task is locked
  const isContainerClosed = selectedTask ? isTaskLocked(selectedTask) : false;
  const lockedReason = selectedTask ? getLockedReason(selectedTask) : '';

  return (
    <div className="home">
      {/* ✅ Sprint Progress Section (Switched from Story Points to Tasks) */}
      <div className="sprint-progress-container">
        {sprintProgressList.map((sp) => (
          <div key={sp.sprintId} className="sprint-progress-card">
            <h4>
              {sp.projectName} → {sp.sprintName}
            </h4>
            <p>
              {sp.completedTasks}/{sp.totalTasks} tasks completed ({sp.progress}%)
            </p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${sp.progress}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="board-title">Dashboard</h2>

      {/* ✅ Task Columns */}
      <div className="columns" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
        {columnsToRender.map((colKey) => (
          <div className="column" key={colKey} style={{ flex: 1, minWidth: '250px' }}>
            <h3>
              {colKey === "backlog" && "📋 Backlog"}
              {colKey === "todo" && "📝 To Do"}
              {colKey === "inprogress" && "⏳ In Progress"}
              {colKey === "reopen" && "🔄 Re-Open"}
              {colKey === "fixed" && "✅ Fixed"}
              {colKey === "done" && "🎉 Done"}
            </h3>

            {/* 🌀 Scrollable content container */}
            <div className="column-tasks">
              {tasks[colKey] && tasks[colKey].length > 0 ? (
                tasks[colKey].map((task) => (
                  <div
                    className={`task-card ${task.type === "bug" ? "bug-card" : ""}`}
                    key={task.id}
                    style={{ justifyContent: 'space-between', gap: '4px' }}
                  >
                    <strong style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, fontSize: '11px', lineHeight: '1.2' }}>
                      {task.type === "bug" && "🐞 "}#{task.id} - {task.userstory || task.title}
                    </strong>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="task-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="arrow-btn"
                          onClick={() => navigate(task.type === "bug" ? `/bug/${task.id}` : `/task/${task.id}`)}
                          title="View"
                        >
                          <FaEye size={20} />
                        </button>
                        <button
                          className="arrow-btn arrow-move-btn"
                          onClick={() => openPopup(task)}
                          title="Move or Update"
                        >
                          ➔
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#aaa", fontSize: "10px", textAlign: "center", margin: "4px 0" }}>
                  No tasks here
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Popup Section */}
      {selectedTask && (
        <div className="popup-overlay">
          <div className="popup-card" style={{ maxWidth: '400px' }}>
            <button className="close-btn" onClick={closePopup}>
              ✖
            </button>
            <h3 style={{ marginBottom: '5px' }}>{selectedTask.userstory || selectedTask.title}</h3>
            
            {/* Status alerts */}
            {selectedTask.sprint?.status && (
              <p style={{ fontSize: '12px', color: '#fff', margin: '0 0 15px 0' }}>
                Sprint: {selectedTask.sprint.name} ({selectedTask.sprint.status})
              </p>
            )}

            {isContainerClosed && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '5px', fontSize: '13px', marginBottom: '15px' }}>
                <strong>Notice:</strong> {lockedReason || "This task belongs to a completed/closed Sprint, Feature, or Project."} Other updates are restricted, but you can still change the status.
              </div>
            )}

            {/* Change Status */}
            <div className="popup-section">
              <label>Change Status:</label>
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
              >
                {filteredStatuses.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.decription || s.description || s.name}
                  </option>
                ))}
              </select>
              {/* Enable only when a DIFFERENT status has been chosen */}
              {(() => {
                const originalStatusId = String(selectedTask.taskStatus?.id || selectedTask.status?.id || "");
                const isDifferent = selectedStatusId && selectedStatusId !== originalStatusId;
                return (
                  <button
                    className="status-btn"
                    disabled={!isDifferent}
                    style={{ cursor: !isDifferent ? 'not-allowed' : 'pointer', opacity: !isDifferent ? 0.5 : 1 }}
                    onClick={() => isDifferent && handleStatusChange(selectedTask.id, selectedStatusId)}
                  >
                    Change Status
                  </button>
                );
              })()}
            </div>

            {/* Move Sprint (Tasks and Bugs) */}
            <div className="popup-section" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <label>Move to Sprint:</label>
              <select
                value={selectedMoveSprintId}
                onChange={(e) => setSelectedMoveSprintId(e.target.value)}
              >
                <option value="">-- Select Sprint --</option>
                {sprints
                  .filter(s => s.id !== selectedTask.sprint?.id) // exclude current sprint
                  .filter(s => {
                    const status = (s.status || '').toLowerCase();
                    return status !== 'completed' && status !== 'closed';
                  })
                  .filter(s => {
                    const taskProjId = selectedTask.feature?.project?.id || selectedTask.task?.feature?.project?.id || selectedTask.sprint?.feature?.project?.id;
                    const sprintProjId = s.feature?.project?.id;
                    if (taskProjId && sprintProjId) {
                      return taskProjId === sprintProjId;
                    }
                    return true;
                  })
                  .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status || 'No status'})
                  </option>
                ))}
              </select>
              <button
                className="status-btn"
                style={{ background: '#f59e0b', marginTop: '10px' }}
                disabled={!selectedMoveSprintId}
                onClick={() =>
                  selectedMoveSprintId &&
                  handleMoveSprint(selectedTask.id, selectedMoveSprintId)
                }
              >
                Move {selectedTask.type === "bug" ? "Bug" : "Task"}
              </button>
              {/* Show selected sprint name below the button */}
              {selectedMoveSprintId && (() => {
                const chosen = sprints.find(s => String(s.id) === String(selectedMoveSprintId));
                return chosen ? (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#fff' }}>
                    Moving to: {chosen.name} ({chosen.status || 'No status'})
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;