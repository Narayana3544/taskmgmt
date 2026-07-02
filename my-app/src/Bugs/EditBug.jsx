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
          api.get(`/bugs/${id}`, { withCredentials: true })
        ]);

        setDevelopers(devRes.data || []);
        setPriorities(priorityRes.data || []);
        setStatuses(statusRes.data || []);

        // Populate form with existing bug data
        const bug = bugRes.data;
        setTitle(bug.title || "");
        setDescription(bug.description || "");
        setPriority(bug.priority?.id || "");
        setStatus(bug.status?.id || "");
        setAssignedTo(bug.assignedUser?.id || "");

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

  return (
    <div className="bug-form-container">
      <h2>Edit Bug</h2>

      <form onSubmit={handleSubmit} className="bug-form">
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Description:</label>
        <textarea
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label>Priority:</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
          <option value="">-- Select Priority --</option>
          {priorities.map((p) => (
            <option key={p.id} value={p.id}>
              {p.decription || p.description || p.name}
            </option>
          ))}
        </select>

        <label>Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">-- Select Status --</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.decription || s.description || s.name}
            </option>
          ))}
        </select>

        <label>Assign To (Developer):</label>
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required>
          <option value="">-- Select Developer --</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.first_name || d.name || d.username}
            </option>
          ))}
        </select>

        <label>Attachments:</label>
        <input type="file" multiple onChange={handleFileChange} />

        <ul className="file-list">
          {files.map((file, idx) => (
            <li key={idx} className="file-item">
              <span>
                {file.name} ({Math.round(file.size / 1024)} KB)
                {uploadProgress[file.name] && (
                  <span className="progress"> - {uploadProgress[file.name]}%</span>
                )}
              </span>
              <button type="button" className="remove-btn" onClick={() => handleRemoveFile(idx)}>❌</button>
            </li>
          ))}
        </ul>

        <div className="btn-container full-width">
          <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
          <button type="submit" className="btn-global btn-primary">Update Bug</button>
        </div>
      </form>
    </div>
  );
}
