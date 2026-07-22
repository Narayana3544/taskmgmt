import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./Bugform.css";

export default function BugForm() {
  const { id } = useParams(); // bugId for edit
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [initialData, setInitialData] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const [developers, setDevelopers] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({}); 

  // Fetch dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, priorityRes, statusRes, bugRes] = await Promise.all([
          api.get("/users", { withCredentials: true }),
          api.get("/Priorities", { withCredentials: true }),
          api.get("/getstatusForTask", { withCredentials: true }),
          api.get(`/view-bug/${id}`, { withCredentials: true })
        ]);

        setDevelopers(devRes.data || []);
        setPriorities(priorityRes.data || []);
        setStatuses(statusRes.data || []);

        // Populate form with existing bug data
        const bug = bugRes.data;
        setTitle(bug.title || "");
        setDescription(bug.description || "");
        setPriority(bug.priority?.id || bug.priority || "");
        setStatus(bug.status?.id || bug.status || "");
        setAssignedTo(bug.assignedUser?.id || bug.assignedUser || "");
        
        setInitialData({
          description: bug.description || "",
          priority: bug.priority?.id || bug.priority || "",
          status: bug.status?.id || bug.status || "",
          assignedTo: bug.assignedUser?.id || bug.assignedUser || ""
        });

        if (bug.attachments && bug.attachments.length > 0) {
          setExistingAttachments(bug.attachments);
        }

        // Optionally, you could also load existing attachments here
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [id]);

  // File handlers
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    setUploadProgress({});
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit (Edit Bug)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !priority || !assignedTo) {
      return alert("Please fill all required fields.");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("priorityId", priority);
    formData.append("statusId", status || 1); 
    formData.append("assignedToId", assignedTo);

    files.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      await api.put(`/bugs/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const loaded = progressEvent.loaded || 0;
          const percent = Math.round((loaded / total) * 100);

          const newProgress = {};
          files.forEach((f) => {
            newProgress[f.name] = percent;
          });
          setUploadProgress(newProgress);
        },
      });

      alert("Bug updated successfully!");
      navigate(-1); // go back to previous page
    } catch (err) {
      console.error("Error updating bug:", err);
      alert("Failed to update bug.");
    }
  };

  const hasChanges = initialData && (
    title !== initialData.title ||
    description !== initialData.description ||
    String(priority) !== String(initialData.priority) ||
    String(status) !== String(initialData.status) ||
    String(assignedTo) !== String(initialData.assignedTo) ||
    files.length > 0
  );

  return (
    <div className="bug-form-container" style={{ maxWidth: '900px' }}>
      <h2>Edit Bug</h2>

      <form onSubmit={handleSubmit} className="bug-form task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px' }}>
        <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
          <label>Description:</label>
          <textarea
            rows="2"
            style={{ minHeight: '34px', padding: '8px' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
          <label>Priority:</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
            <option value="">-- Select Priority --</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.decription || p.description || p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">-- Select Status --</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.decription || s.description || s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
          <label>Assign To (Developer):</label>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required>
            <option value="">-- Select Developer --</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.first_name || d.name || d.username}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width attachment-container" style={{ gridColumn: 'span 6', margin: 0 }}>
          {existingAttachments.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Existing Attachments:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {existingAttachments.map((att) => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <span>📎 {att.fileName || att.filename || att.attachmentName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label>{existingAttachments.length > 0 ? "Add Additional Attachments:" : "Attachments:"}</label>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input type="file" multiple onChange={handleFileChange} style={{ padding: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              {files.length > 0 && (
                <ul className="file-list" style={{ marginTop: 0 }}>
                  {files.map((file, idx) => (
                    <li key={idx} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', padding: '2px 8px' }}>
                      <span style={{ fontSize: '13px' }}>
                        📎 {file.name} ({Math.round(file.size / 1024)} KB)
                        {uploadProgress[file.name] && (
                          <span className="progress" style={{ color: "var(--color-success)"}}> - {uploadProgress[file.name]}%</span>
                        )}
                      </span>
                      <button type="button" className="remove-btn" onClick={() => handleRemoveFile(idx)} style={{ width: '16px', height: '16px', fontSize: '10px' }}>❌</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="btn-container full-width" style={{ gridColumn: 'span 6', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
          <button type="submit" className="btn-global btn-primary" disabled={!hasChanges} style={{ opacity: !hasChanges ? 0.6 : 1, cursor: !hasChanges ? 'not-allowed' : 'pointer' }}>Update Bug</button>
        </div>
      </form>
    </div>
  );
}
