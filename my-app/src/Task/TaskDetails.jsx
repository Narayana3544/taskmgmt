// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import "./TaskDetails.css";

// export default function TaskDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [task, setTask] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     axios
//       .get(`http://localhost:8080/api/view-task/${id}`, { withCredentials: true })
//       .then((res) => {
//         setTask(res.data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error fetching task details:", err);
//         setError("Failed to load task details.");
//         setLoading(false);
//       });
//   }, [id]);

//   const downloadFile = (taskId) => {
//     if (!task || task.attachment_flag !== "Yes") {
//       alert("No attachment exists for this task.");
//       return;
//     }
//     window.open(`http://localhost:8080/api/tasks/${taskId}/download`, "_blank");
//   };

//   if (loading) return <p>Loading task details...</p>;
//   if (error) return <p>{error}</p>;
//   if (!task) return <p>No task found.</p>;

//   return (
//     <div className="task-details-container">
//       <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>

//       <div className="task-card">
//         {/* Title + status + points */}
//         <div className="task-header">
//           <div className="task-icon">📌</div>
//           <h1>{task.userstory || "Untitled Task"}</h1>
//           <span className={`status-badge ${task.taskStatus?.description?.toLowerCase().replace(" ", "-")}`}>
//             {task.taskStatus?.decription || task.taskStatus?.description || "No Status"}
//           </span>
//         </div>

//         {/* Info grid */}
//         <div className="task-info-grid">
//           <p><strong>Task ID:</strong> {task.id}</p>
//           <p><strong>Assignee:</strong> {task.user?.first_name || "-"}</p>
//           <p><strong>Reporter:</strong> {task.reportedTo?.first_name || "-"}</p>
//           <p><strong>Sprint:</strong> {task.sprint?.sprintName || task.sprint?.name || "-"}</p>
//           <p><strong>Feature:</strong> {task.feature?.name || "-"}</p>
//           <p><strong>Start Date:</strong> {task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</p>
//           <p><strong>End Date:</strong> {task.end_date ? new Date(task.end_date).toLocaleDateString() : "-"}</p>
//           <p><strong>Story Points:</strong> {task.storypoints ?? "-"}</p>
//         </div>

//         {/* Description */}
//         <div className="task-section">
//           <h3>Description</h3>
//           <ul>
//             {task.description
//               ? task.description
//                   .split(/\d+:/)
//                   .filter(line => line.trim() !== "")
//                   .map((line, idx) => <li key={idx}>{line.trim()}</li>)
//               : <li>-</li>}
//           </ul>
//         </div>

//         {/* Acceptance Criteria */}
//         <div className="task-section">
//           <h3>Acceptance Criteria</h3>
//           <p>{task.acceptance_criteria || "-"}</p>
//         </div>

//         {/* Comments */}
//         <div className="task-section">
//           <h3>Comments</h3>
//           <textarea placeholder="Add a comment..."></textarea>
//           <button className="comment-btn">Comment</button>
//         </div>

//         {/* Download Button */}
//         <button
//           onClick={() => downloadFile(task.id)}
//           disabled={task.attachment_flag !== "Yes"}
//           className={`download-btn ${task.attachment_flag !== "Yes" ? "disabled" : ""}`}
//         >
//           {task.attachment_flag === "Yes" ? "Download Attachment" : "No Attachment"}
//         </button>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskDetails.css";

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [users, setUsers] = useState([]); // to assign task
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch task + comments + users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, commentRes, usersRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/view-task/${id}`, { withCredentials: true }),
          axios.get(`http://localhost:8080/api/viewComments/${id}`, { withCredentials: true }),
          axios.get(`http://localhost:8080/api/tasks/viewUsers/${id}`, { withCredentials: true }) // Assuming API for listing users
        ]);
        console.log(usersRes.data);
        setTask(taskRes.data);
        setComments(commentRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Error loading task:", err);
        setError("Failed to load task details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Add a new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:8080/api/addComment/${id}`,
        { description: newComment },
        { withCredentials: true }
      );
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Assign task to a user
  const handleAssignTask = async () => {
    if (!selectedUser) return alert("Please select a user to assign.");
    try {
      await axios.post(
        `http://localhost:8080/api/tasks/${id}/assignTo/${selectedUser}`,
        
        {},
        { withCredentials: true }
      );
      alert("Task assigned successfully!");
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  const downloadFile = (taskId) => {
    if (!task || task.attachment_flag !== "Yes") {
      alert("No attachment exists for this task.");
      return;
    }
    window.open(`http://localhost:8080/api/tasks/${taskId}/download`, "_blank");
  };

  if (loading) return <p>Loading task details...</p>;
  if (error) return <p>{error}</p>;
  if (!task) return <p>No task found.</p>;

  return (
    <div className="task-details-container">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>

      <div className="task-card">
        {/* Title + status */}
        <div className="task-header">
          <div className="task-icon">📌</div>
          <h1>{task.userstory || "Untitled Task"}</h1>
          <span className={`status-badge ${task.taskStatus?.description?.toLowerCase().replace(" ", "-")}`}>
            {task.taskStatus?.decription || task.taskStatus?.description || "No Status"}
          </span>
        </div>

        {/* Info grid */}
        <div className="task-info-grid">
          <p><strong>Task ID:</strong> {task.id}</p>
          <p><strong>Assignee:</strong> {task.user?.first_name || "-"}</p>
          <p><strong>Reporter:</strong> {task.reportedTo?.first_name || "-"}</p>
          <p><strong>Sprint:</strong> {task.sprint?.sprintName || task.sprint?.name || "-"}</p>
          <p><strong>Feature:</strong> {task.feature?.name || "-"}</p>
          <p><strong>Start Date:</strong> {task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</p>
          <p><strong>End Date:</strong> {task.end_date ? new Date(task.end_date).toLocaleDateString() : "-"}</p>
          <p><strong>Story Points:</strong> {task.storypoints ?? "-"}</p>
        </div>

        {/* Description */}
        <div className="task-section">
          <h3>Description</h3>
          <ul>
            {task.description
              ? task.description.split(/\d+:/).filter(line => line.trim() !== "")
                .map((line, idx) => <li key={idx}>{line.trim()}</li>)
              : <li>-</li>}
          </ul>
        </div>

        {/* Acceptance Criteria */}
        <div className="task-section">
          <h3>Acceptance Criteria</h3>
          <p>{task.acceptance_criteria || "-"}</p>
        </div>

        {/* Comments */}
        <div className="task-section">
          <h3>Comments</h3>
          <ul className="comment-list">
            {comments.length > 0 ? comments.map(c => (
              <li key={c.id}>
                <strong>{c.user?.first_name || "Unknown"}:</strong> {c.description}
              </li>
            )) : <li>No comments yet.</li>}
          </ul>
          <textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <button className="comment-btn" onClick={handleAddComment}>Comment</button>
        </div>

        {/* Assign Task */}
        <div className="task-section">
          <h3>Assign Task</h3>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="">-- Select User --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.user?.first_name}
              </option>
            ))}
          </select>
          <button className="assign-btn" onClick={handleAssignTask}>Assign</button>
        </div>

        {/* Download */}
        <button
          onClick={() => downloadFile(task.id)}
          disabled={task.attachment_flag !== "Yes"}
          className={`download-btn ${task.attachment_flag !== "Yes" ? "disabled" : ""}`}
        >
          {task.attachment_flag === "Yes" ? "Download Attachment" : "No Attachment"}
        </button>
      </div>
    </div>
  );
}


