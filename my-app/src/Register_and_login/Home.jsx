
import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import "./Home.css";
import api from "../api";

const Home = () => {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
   const navigate = useNavigate();

  useEffect(() => {
    // Fetch tasks
    api
      .get("/user/tasks", { withCredentials: true })
      .then((res) => {
       // after GET /api/user/tasks
        const grouped = { todo: [], inprogress: [], done: [] };
        res.data.forEach((task) => {
          const label = task.taskStatus?.decription || task.status; // decription is intentional
          grouped[toColKey(label)].push(task);
        });
        setTasks(grouped);

      })
      .catch((err) => console.error("Error fetching tasks:", err));

    // Fetch statuses
    api
      .get("/getstatusForTask", { withCredentials: true })
      .then((res) => setStatuses(res.data))
      .catch((err) => console.error("Error fetching statuses:", err));

    // Fetch users
    api
      .get("/users", { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const openPopup = (task) => {
    setSelectedTask(task);
    setSelectedUserId("");
    setSelectedStatusId("");
  };

  const closePopup = () => {
    setSelectedTask(null);
  };

  // ✅ Assign user
  const handleAssignUser = () => {
    if (!selectedUserId || !selectedTask) return;

    api
      .put(
        `/tasks/${selectedTask.id}/assignTo/${selectedUserId}`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        
        setTasks((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((col) => {
            updated[col] = updated[col].map((task) =>
              task.id === selectedTask.id
                ? { ...task, user: users.find((u) => u.id === parseInt(selectedUserId)) }
                : task
            );
          });
          return updated;
        });
        
        closePopup();
      })
      .catch((err) => console.error("Error assigning user:", err));
  };

  // ✅ Change status
const toColKey = (label) => {
  const key = (label || "").toLowerCase().replace(/\s/g, "");
  return ["todo", "inprogress", "done"].includes(key) ? key : "todo";
};

const handleStatusChange = (taskId, statusId) => {
  api
    .put(
      `/tasks/${taskId}/status/${statusId}`,
      {},
      { withCredentials: true }
    )
    .then(() => {
      const newStatus = statuses.find((s) => s.id === Number(statusId)); // uses decription
      setTasks((prev) => {
        const updated = { todo: [], inprogress: [], done: [] };

        // flatten then rebuild into columns
        const all = [...prev.todo, ...prev.inprogress, ...prev.done];
        all.forEach((task) => {
          if (task.id === taskId) {
            const updatedTask = {
              ...task,
              taskStatus: newStatus,
              status: newStatus?.decription, // keep flat field if you use it elsewhere
            };
            updated[toColKey(newStatus?.decription)].push(updatedTask);
          } else {
            const currentLabel = task.taskStatus?.decription || task.status; // <-- key fix
            updated[toColKey(currentLabel)].push(task);
          }
        });

        return updated;
      });

      // close popup
      setSelectedTask(null); // or call your closePopup() if you have it
    })
    .catch((err) => console.error("Error updating status:", err));
};


  return (
    <div className="home">
      <h2 className="board-title">🗂️ Task Board</h2>

      <div className="columns">
        {["todo", "inprogress", "done"].map((colKey) => (
          <div className="column" key={colKey}>
            <h3>
              {colKey === "todo" && "📝 To Do"}
              {colKey === "inprogress" && "⏳ In Progress"}
              {colKey === "done" && "✅ Done"}
            </h3>

            {tasks[colKey].map((task) => (
              <div className="task-card" key={task.id}>
              {/* Top-left ID */}
              <div className="task-id">ID: {task.id}</div>

              {/* Main content (title + actions) */}
              <div className="task-content">
                <strong>{task.userstory || task.title}</strong>
                <div className="task-actions">
                  <button
                    className="arrow-btn"
                    onClick={() => navigate(`/task/${task.id}`)}
                    title="View Task"
                  >
                    <FaEye size={18} />
                  </button>
                  <button
                    className="arrow-btn"
                    onClick={() => openPopup(task)}
                    title="Move Task"
                  >
                    ➔
                  </button>
                </div>
              </div>

              {/* Bottom-right Story Points */}
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

            ))}
          </div>
        ))}
      </div>

      {/* Popup */}
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
              <label>Select User:</label>
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
              </button>
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
                  selectedStatusId && handleStatusChange(selectedTask.id, selectedStatusId)
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

