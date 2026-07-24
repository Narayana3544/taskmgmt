import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { sortAlphabetically } from "../utils/sortUtils";
import "./TaskForm.css";
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

  const handleAssignTask = async () => {
    if (!selectedUser) return alert("Please select a user to assign.");
    try {
      await api.put(`/tasks/${id}/assignTo/${selectedUser}`, {}, { withCredentials: true });
      alert("Task assigned successfully!");
      const assignedUserObj = users.find((u) => u.user?.id === parseInt(selectedUser))?.user;
      setTask((prev) => ({ ...prev, user: assignedUserObj }));
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  const downloadFile = async (taskId, attachmentId = null, filename = null, contentTypeStr = null) => {
    if (!task || task.attachment_flag !== "Yes") {
      alert("No attachment exists for this task.");
      return;
    }
    try {
      let url = `/tasks/${taskId}/download`;
      if (attachmentId) url = `/tasks/attachment/${attachmentId}/download`;

      const response = await api.get(url, { responseType: "blob" });
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

  const statusLabel = task.taskStatus?.decription || task.taskStatus?.description || "No Status";

  return (
    <div className="task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>

      {/* ── Row 1: Project · Feature · Task Type · Task Status ── */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Project</label>
        <input type="text" readOnly value={task.feature?.project?.name || "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Feature</label>
        <input type="text" readOnly value={task.feature?.name || "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Task Type</label>
        <input type="text" readOnly value={task.taskType?.description || "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Task Status</label>
        <input type="text" readOnly value={statusLabel} style={{ fontWeight: 600, color: '#1a71e2' }} />
      </div>

      {/* ── Row 2: User Story · Description ── */}
      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>User Story</label>
        <textarea readOnly rows={2} style={{ minHeight: '34px', padding: '8px', resize: 'none' }} value={task.userstory || "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Description</label>
        <textarea readOnly rows={2} style={{ minHeight: '34px', padding: '8px', resize: 'none' }} value={task.description || "-"} />
      </div>

      {/* ── Row 3: Acceptance Criteria ── */}
      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Acceptance Criteria</label>
        <textarea readOnly rows={2} style={{ minHeight: '34px', padding: '8px', resize: 'none' }} value={task.acceptance_criteria || "-"} />
      </div>

      {/* ── Row 4: Complexity · Story Points · Sprint ── */}
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Complexity</label>
        <input type="text" readOnly value={task.complexity ?? "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Story Points</label>
        <input type="text" readOnly value={task.storypoints ?? "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Sprint</label>
        <input type="text" readOnly value={task.sprint?.name || task.sprint?.sprintName || "-"} />
      </div>

      {/* ── Row 5: Start Date · End Date · Assignee · Reporter ── */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Start Date</label>
        <input type="text" readOnly value={task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>End Date</label>
        <input type="text" readOnly value={task.end_date ? new Date(task.end_date).toLocaleDateString() : "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Assignee</label>
        <input type="text" readOnly value={task.user?.first_name || "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Reporter</label>
        <input type="text" readOnly value={task.reportedTo?.first_name || task.reportedTo?.preffered_name || "-"} />
      </div>

      {/* ── Row 6: Assign Task · Attachments · Comments ── */}
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Assign Task</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ flex: 1, padding: '0.5rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            <option value="">-- Select User --</option>
            {users.map((u) => (
              <option key={u.user?.id} value={u.user?.id}>{u.user?.first_name}</option>
            ))}
          </select>
          <button className="btn-global btn-primary" onClick={handleAssignTask} style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '13px' }}>
            Assign
          </button>
        </div>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Attachments</label>
        {task.attachment_flag === "Yes" ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {task.attachments && task.attachments.length > 0 ? (
              task.attachments.map((att) => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px' }}>📎 {att.attachmentName}</span>
                  <button onClick={() => downloadFile(task.id, att.id, att.attachmentName, att.attachmentType)} className="btn-global btn-primary" style={{ padding: '3px 10px', fontSize: '12px' }}>
                    Download
                  </button>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px' }}>📎 {task.attachmentName || task.attachment_name || "Attached File"}</span>
                <button onClick={() => downloadFile(task.id)} className="btn-global btn-primary" style={{ padding: '3px 10px', fontSize: '12px' }}>
                  Download
                </button>
              </div>
            )}
          </div>
        ) : (
          <input type="text" readOnly value="No Attachments" />
        )}
      </div>

      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Comments</label>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '6px 8px', background: 'var(--bg-tertiary)', maxHeight: '80px', overflowY: 'auto', fontSize: '13px', marginBottom: '6px' }}>
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} style={{ marginBottom: '3px' }}>
                <strong>{c.user?.first_name || "Unknown"}:</strong> {c.description}
              </div>
            ))
          ) : (
            <span style={{ color: '#999' }}>No comments yet.</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={1}
            style={{ flex: 1, padding: '5px 8px', fontSize: '13px', resize: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          />
          <button className="btn-global btn-primary" onClick={handleAddComment} style={{ padding: '4px 10px', fontSize: '13px', whiteSpace: 'nowrap' }}>
            Comment
          </button>
        </div>
      </div>

      {/* ── Buttons ── */}
      <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

    </div>
  );
}
