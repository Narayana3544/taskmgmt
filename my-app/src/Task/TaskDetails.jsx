import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { sortAlphabetically } from "../utils/sortUtils";
import "./TaskDetails.css";

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch task + comments + users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, commentRes, usersRes] = await Promise.all([
          api.get(`/view-task/${id}`, { withCredentials: true }),
          api.get(`/viewComments/${id}`, { withCredentials: true }),
          api.get(`/tasks/viewUsers/${id}`, { withCredentials: true }),
        ]);

        setTask(taskRes.data);
        setComments(commentRes.data);
        setUsers(sortAlphabetically(usersRes.data));

        // ✅ Bind dropdown to current assigned user
        setSelectedUser(taskRes.data.user?.id || "");
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
      const res = await api.post(
        `/addComment/${id}`,
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
      await api.put(`/tasks/${id}/assignTo/${selectedUser}`, {}, { withCredentials: true });
      alert("Task assigned successfully!");

      // ✅ Update UI instantly
      const assignedUserObj = users.find(
        (u) => u.user?.id === parseInt(selectedUser)
      )?.user;
      setTask((prev) => ({ ...prev, user: assignedUserObj }));
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  // ✅ File download function
  const downloadFile = async (taskId, attachmentId = null, filename = null, contentTypeStr = null) => {
    if (!task || task.attachment_flag !== "Yes") {
      alert("No attachment exists for this task.");
      return;
    }

    try {
      let url = `/tasks/${taskId}/download`;
      if (attachmentId) {
        url = `/tasks/attachment/${attachmentId}/download`;
      }

      const response = await api.get(url, {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || contentTypeStr || "";
      const blob = new Blob([response.data], { type: contentType });
      const disposition = response.headers["content-disposition"];
      
      let finalFilename = filename || task.attachment_name || task.attachmentName;
      if (disposition && disposition.includes("filename=")) {
        finalFilename = disposition.split("filename=")[1].replace(/"/g, "");
      }
      
      finalFilename = finalFilename || `attachment_${taskId}`;
      
      if (!finalFilename.includes(".")) {
        let ext = "";
        if (contentType.includes("pdf")) ext = ".pdf";
        else if (contentType.includes("spreadsheetml") || contentType.includes("excel")) ext = ".xlsx";
        else if (contentType.includes("text")) ext = ".txt";
        else if (contentType.includes("image/jpeg")) ext = ".jpg";
        else if (contentType.includes("image/png")) ext = ".png";
        
        finalFilename += ext;
      }

      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlObj);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed");
    }
  };

  if (loading) return <p>Loading task details...</p>;
  if (error) return <p>{error}</p>;
  if (!task) return <p>No task found.</p>;

  return (
    <div className="task-details-container">

      <div className="task-card" style={{ padding: '15px' }}>
        {/* Header */}
        <div className="task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="task-icon">📌</div>
            <h1 style={{ margin: 0, fontSize: '18px' }}>{task.userstory || "Untitled Task"}</h1>
            <span
              className={`status-badge ${
                task.taskStatus?.description?.toLowerCase().replace(" ", "-") || ""
              }`}
            >
              {task.taskStatus?.decription ||
                task.taskStatus?.description ||
                "No Status"}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-global btn-secondary" style={{ padding: '5px 15px', fontSize: '13px' }} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
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
          <p><strong>Complexity:</strong> {task.complexity ?? "-"}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Description */}
          <div className="task-section" style={{ marginTop: 0, padding: '8px' }}>
            <h3 style={{ fontSize: '13px' }}>Description</h3>
            <ul style={{ fontSize: '13px', margin: 0, paddingLeft: '15px' }}>
              {task.description
                ? task.description
                    .split(/\d+:/)
                    .filter((line) => line.trim() !== "")
                    .map((line, idx) => <li key={idx}>{line.trim()}</li>)
                : <li>-</li>}
            </ul>
          </div>

          {/* Acceptance Criteria */}
          <div className="task-section" style={{ marginTop: 0, padding: '8px' }}>
            <h3 style={{ fontSize: '13px' }}>Acceptance Criteria</h3>
            <ul style={{ fontSize: '13px', margin: 0, paddingLeft: '15px' }}>
              {task.acceptance_criteria
                ? task.acceptance_criteria
                    .split(/\d+\)/)
                    .filter((line) => line.trim() !== "")
                    .map((line, idx) => <li key={idx}>{line.trim()}</li>)
                : <li>-</li>}
            </ul>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          {/* Comments */}
          <div className="task-section" style={{ marginTop: 0, padding: '8px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '13px', marginBottom: '5px' }}>Comments</h3>
            <ul className="comment-list" style={{ fontSize: '13px', margin: 0, paddingLeft: '15px', flexGrow: 1, maxHeight: '80px', overflowY: 'auto' }}>
              {comments.length > 0 ? (
                comments.map((c) => (
                  <li key={c.id}>
                    <strong>{c.user?.first_name || "Unknown"}:</strong> {c.description}
                  </li>
                ))
              ) : (
                <li>No comments yet.</li>
              )}
            </ul>
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ height: '30px', padding: '5px', flexGrow: 1, resize: 'none', fontSize: '12px', minHeight: '30px' }}
              />
              <button className="comment-btn" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={handleAddComment}>
                Comment
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Assign Task */}
            <div className="task-section" style={{ marginTop: 0, padding: '8px' }}>
              <h3 style={{ fontSize: '13px', marginBottom: '5px' }}>Assign Task</h3>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{ fontSize: '12px', padding: '4px', flexGrow: 1 }}
                >
                  <option value="">-- Select User --</option>
                  {users.map((u) => (
                    <option key={u.user?.id} value={u.user?.id}>
                      {u.user?.first_name}
                    </option>
                  ))}
                </select>
                <button className="assign-btn" onClick={handleAssignTask} style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}>
                  Assign
                </button>
              </div>
            </div>

            {/* Attachments */}
            <div className="task-section" style={{ marginTop: 0, padding: '8px', flexGrow: 1 }}>
              <h3 style={{ fontSize: '13px', marginBottom: '5px' }}>Attachments</h3>
              {task.attachment_flag === "Yes" ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {task.attachments && task.attachments.length > 0 ? (
                    task.attachments.map((att) => (
                      <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: "bold", color: "#555", fontSize: '12px' }}>
                          📎 {att.attachmentName}
                        </span>
                        <button
                          onClick={() => downloadFile(task.id, att.id, att.attachmentName, att.attachmentType)}
                          className="btn-global btn-primary"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          Download
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontWeight: "bold", color: "#555", fontSize: '12px' }}>
                        📎 {task.attachmentName || task.attachment_name || "Attached File"}
                      </span>
                      <button
                        onClick={() => downloadFile(task.id)}
                        className="btn-global btn-primary"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: "#777", margin: 0, fontSize: '12px' }}>No Attachments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
