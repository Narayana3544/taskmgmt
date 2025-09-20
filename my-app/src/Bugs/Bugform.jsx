import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./Bugform.css";

export default function BugForm() {
  const { id } = useParams(); // taskId
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
  const [uploadProgress, setUploadProgress] = useState({}); // track per-file progress

  // Fetch dropdown data (separate calls, easier to read)
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await api.get("/users", { withCredentials: true });
        setDevelopers(res.data || []);
        console.log("Developers:", res.data);
      } catch (err) {
        console.error("Error fetching developers:", err);
      }
    };

    const fetchPriorities = async () => {
      try {
        const res = await api.get("/Priorities", { withCredentials: true });
        setPriorities(res.data || []);
        console.log("Priorities:", res.data);
      } catch (err) {
        console.error("Error fetching priorities:", err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const res = await api.get("/getstatusForTask", { withCredentials: true });
        setStatuses(res.data || []);
        console.log("Statuses:", res.data);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };

    fetchDevelopers();
    fetchPriorities();
    fetchStatuses();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]); // allow multiple file add
    setUploadProgress({});
  };

  // Remove file
  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!title.trim() || !description.trim() || !priority || !assignedTo) {
    return alert("Please fill all required fields.");
  }

  const formData = new FormData();
  formData.append("taskId", id);
  formData.append("title", title);
  formData.append("description", description);
  formData.append("priorityId", priority);
  formData.append("statusId", status || 1); // default "Open"
  formData.append("assignedToId", assignedTo);

  files.forEach((file) => {
    formData.append("attachments", file);
  });

  try {
    await api.post("/bugs", formData, {
      withCredentials: true, // important to send cookies/session
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

    alert("Bug created successfully!");
    navigate(`/task/${id}`);
  } catch (err) {
    console.error("Error creating bug:", err);
    alert("Failed to create bug.");
  }
};



  return (
    <div className="bug-form-container">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
      <h2>Create Bug for Task #{id}</h2>

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
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
        >
          <option value="">-- Select Developer --</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.first_name || d.name || d.username}
            </option>
          ))}
        </select>

        <label>Attachments:</label>
        <input type="file" multiple onChange={handleFileChange} />

        {/* Show file list with progress + delete button */}
        <ul className="file-list">
          {files.map((file, idx) => (
            <li key={idx} className="file-item">
              <span>
                {file.name} ({Math.round(file.size / 1024)} KB)
                {uploadProgress[file.name] && (
                  <span className="progress"> - {uploadProgress[file.name]}%</span>
                )}
              </span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveFile(idx)}
              >
                ❌
              </button>
            </li>
          ))}
        </ul>

        <button type="submit" className="submit-btn">Submit Bug</button>
      </form>
    </div>
  );
}
