import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import api from "../api";

const Home = () => {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
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
        // 1️⃣ Fetch tasks
        const tasksRes = await api.get("/user/Sprintactive/tasks", { withCredentials: true });
        let allTasks = tasksRes.data;

        // 2️⃣ Fetch bugs assigned to user
        const bugsRes = await api.get("/user/bugs", { withCredentials: true });
        const bugs = bugsRes.data.map((bug) => ({
          ...bug,
          type: "bug",
          title: bug.title,
          description: bug.description,
          storypoints: bug.storypoints || 1, // default SP if missing
          taskStatus: bug.status,
          assignedUser: bug.assignedUser,
        }));

        // 3️⃣ Merge tasks + bugs
        allTasks = [...allTasks, ...bugs];

        // 4️⃣ Group by status
        const grouped = { todo: [], inprogress: [], done: [] };
        allTasks.forEach((task) => {
          const label = task.taskStatus?.decription || task.status;
          grouped[toColKey(label)].push(task);
        });

        setTasks(grouped);

        // 5️⃣ Fetch statuses
        const statusRes = await api.get("/getstatusForTask", { withCredentials: true });
        setStatuses(statusRes.data);

        // 6️⃣ Fetch users
        const usersRes = await api.get("/users", { withCredentials: true });
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAllSprintProgress();
    fetchData();
  }, []);

  // ✅ Converts status label to key
  const toColKey = (label) => {
    const key = (label || "").toLowerCase().replace(/\s/g, "");
    return ["todo", "inprogress", "done"].includes(key) ? key : "todo";
  };

  // ✅ Popup open/close
  const openPopup = (task) => {
    setSelectedTask(task);
    setSelectedUserId(task.user?.id || task.assignedUser?.id || "");
    setSelectedStatusId(task.taskStatus?.id || "");
  };

  const closePopup = () => setSelectedTask(null);

  // ✅ Assign user
  const handleAssignUser = () => {
    if (!selectedUserId || !selectedTask) return;

    const url =
      selectedTask.type === "bug"
        ? `/bugs/${selectedTask.id}/assignTo/${selectedUserId}`
        : `/tasks/${selectedTask.id}/assignTo/${selectedUserId}`;

    api
      .put(url, {}, { withCredentials: true })
      .then(() => {
        setTasks((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((col) => {
            updated[col] = updated[col].map((task) =>
              task.id === selectedTask.id
                ? { ...task, assignedUser: users.find((u) => u.id === parseInt(selectedUserId)) }
                : task
            );
          });
          return updated;
        });
        closePopup();
      })
      .catch((err) => console.error("Error assigning user:", err));
  };

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
        const newStatus = statuses.find((s) => s.id === Number(statusId));
        setTasks((prev) => {
          const updated = { todo: [], inprogress: [], done: [] };
          const all = [...prev.todo, ...prev.inprogress, ...prev.done];
          all.forEach((task) => {
            if (task.id === taskId) {
              const updatedTask = {
                ...task,
                taskStatus: newStatus,
                status: newStatus?.decription,
              };
              updated[toColKey(newStatus?.decription)].push(updatedTask);
            } else {
              const currentLabel = task.taskStatus?.decription || task.status;
              updated[toColKey(currentLabel)].push(task);
            }
          });
          return updated;
        });

        closePopup();

        // ✅ Fetch sprint progress again after status update
        fetchAllSprintProgress();
      })
      .catch((err) => console.error("Error updating status:", err));
  };

  return (
    <div className="home">
      {/* ✅ Sprint Progress Section */}
      <div className="sprint-progress-container">
        {sprintProgressList.map((sp) => (
          <div key={sp.sprintId} className="sprint-progress-card">
            <h4>
              {sp.projectName} → {sp.sprintName}
            </h4>
            <p>
              {/* {sp.completedTasks}/{sp.totalTasks} tasks completed ({sp.progress}%) */}
              {sp.completedStoryPoints}/{sp.TargettedStoryPoints} story points completed ({sp.progress1}%)
            </p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${sp.progress1}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="board-title">Dashboard</h2>

      {/* ✅ Task Columns */}
<div className="columns">
  {["todo", "inprogress", "done"].map((colKey) => (
    <div className="column" key={colKey}>
      <h3>
        {colKey === "todo" && "📝 To Do"}
        {colKey === "inprogress" && "⏳ In Progress"}
        {colKey === "done" && "✅ Done"}
      </h3>

      {/* 🌀 Scrollable content container */}
      <div className="column-tasks">
        {tasks[colKey].length > 0 ? (
          tasks[colKey].map((task) => (
            <div
              className={`task-card ${task.type === "bug" ? "bug-card" : ""}`}
              key={task.id}
            >
              <div className="task-id">
                {task.type === "bug" && "🐞 "}ID: {task.id}
              </div>

              <div className="task-content">
                <strong>{task.userstory || task.title}</strong>
                <div className="task-actions">
                  <button
                    className="arrow-btn"
                    onClick={() =>
                      navigate(task.type === "bug" ? `/bug/${task.id}` : `/task/${task.id}`)
                    }
                    title="View"
                  >
                    <FaEye size={18} />
                  </button>
                  <button
                    className="arrow-btn"
                    onClick={() => openPopup(task)}
                    title="Move"
                  >
                    ➔
                  </button>
                </div>
              </div>

              <div
                className={`storypoints-badge ${
                  task.storypoints <= 1
                    ? "low"
                    : task.storypoints <= 3
                    ? "medium"
                    : "high"
                }`}
              >
                {task.storypoints} SP
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#aaa", fontSize: "0.9rem", textAlign: "center", marginTop: "20px" }}>
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
          <div className="popup-card">
            <button className="close-btn" onClick={closePopup}>
              ✖
            </button>
            <h3>{selectedTask.userstory || selectedTask.title}</h3>
            <p>{selectedTask.description}</p>

            {/* Assign User */}
            <div className="popup-section">
              {/* <label>Assigned User:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Select User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.preffered_name || u.username}
                  </option>
                ))}
              </select>
              <button className="assign-btn" onClick={handleAssignUser}>
                Assign User
              </button> */}
            </div>

            {/* Change Status */}
            <div className="popup-section">
              <label>Change Status:</label>
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
              >
                <option value="">-- Select Status --</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.decription}
                  </option>
                ))}
              </select>
              <button
                className="status-btn"
                onClick={() =>
                  selectedStatusId &&
                  handleStatusChange(selectedTask.id, selectedStatusId)
                }
              >
                Change Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;