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

//   if (loading) return <p>Loading task details...</p>;
//   if (error) return <p>{error}</p>;
//   if (!task) return <p>No task found.</p>;
//   const downloadFile = (taskId) => {
//     window.open(`http://localhost:8080/api/tasks/${taskId}/download`, "_blank");
// };

// // Example button


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
//           <p><strong>Story Points:</strong>{task.storypoints ?? "-"}</p>
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
//         <button onClick={() => downloadFile(task.id)}>
//   Download Attachment
// </button>
        
//       </div>
//       {/* <div className="button-container">
//         <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
//         <button className="edit-btn" onClick={-1}>Edit</button>
//       </div> */}


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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:8080/api/view-task/${id}`, { withCredentials: true })
      .then((res) => {
        setTask(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching task details:", err);
        setError("Failed to load task details.");
        setLoading(false);
      });
  }, [id]);

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
        {/* Title + status + points */}
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
              ? task.description
                  .split(/\d+:/)
                  .filter(line => line.trim() !== "")
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
          <textarea placeholder="Add a comment..."></textarea>
          <button className="comment-btn">Comment</button>
        </div>

        {/* Download Button */}
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

