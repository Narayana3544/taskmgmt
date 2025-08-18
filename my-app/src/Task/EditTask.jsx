import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskForm.css";

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [features, setFeatures] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [managers, setManagers] = useState([]);

  // Form states
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [attachmentFlag, setAttachmentFlag] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState("");
  const [storypoints, setStorypoints] = useState("");
  const [userstory, setUserstory] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [reportedTo, setReportedTo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [selectedTaskStatus, setSelectedTaskStatus] = useState("");
  const [existingAttachmentName, setExistingAttachmentName] = useState(""); // To show current file

  useEffect(() => {
    // Fetch task details
    axios.get(`http://localhost:8080/api/view-task/${id}`, { withCredentials: true })
      .then(res => {
        const task = res.data;
        setAcceptanceCriteria(task.acceptance_criteria || "");
        setStorypoints(task.storypoints || "");
        setUserstory(task.userstory || "");
        setDescription(task.description || "");
        setStartDate(task.start_date || "");
        setEndDate(task.end_date || "");
        setSelectedSprint(task.sprint?.id || "");
        setSelectedFeature(task.feature?.id || "");
        setSelectedUser(task.user?.id || "");
        setReportedTo(task.reportedTo?.id || "");
        setSelectedTaskType(task.taskType?.id || "");
        setSelectedTaskStatus(task.taskStatus?.id || "");
        if (task.attachment) {
          setAttachmentFlag("Yes");
          setExistingAttachmentName(task.attachment.fileName || "Current File");
        } else {
          setAttachmentFlag("No");
        }
      })
      .catch(err => console.error("Failed to load task:", err));

    // Fetch dropdown data
    axios.get("http://localhost:8080/api/users", { withCredentials: true }).then(res => setUsers(res.data));
    axios.get("http://localhost:8080/api/sprints", { withCredentials: true }).then(res => setSprints(res.data));
    axios.get("http://localhost:8080/api/features", { withCredentials: true }).then(res => setFeatures(res.data));
    axios.get("http://localhost:8080/api/gettype", { withCredentials: true }).then(res => setTaskTypes(res.data));
    axios.get("http://localhost:8080/api/getstatus", { withCredentials: true }).then(res => setTaskStatuses(res.data));
    axios.get("http://localhost:8080/api/managers", { withCredentials: true }).then(res => setManagers(res.data));
  }, [id]);

  const handleSelectChange = setter => e => {
    const val = e.target.value;
    setter(val ? Number(val) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const taskObj = {
      acceptance_criteria: acceptanceCriteria,
      storypoints: storypoints ? Number(storypoints) : null,
      userstory,
      description,
      start_date: startDate || null,
      end_date: endDate || null,
      sprint: selectedSprint ? { id: Number(selectedSprint) } : null,
      feature: selectedFeature ? { id: Number(selectedFeature) } : null,
      user: selectedUser ? { id: Number(selectedUser) } : null,
      taskType: selectedTaskType ? { id: Number(selectedTaskType) } : null,
      taskStatus: selectedTaskStatus ? { id: Number(selectedTaskStatus) } : null,
      reportedTo: reportedTo ? { id: Number(reportedTo) } : null,
    };

    const formData = new FormData();
    formData.append("task", new Blob([JSON.stringify(taskObj)], { type: "application/json" }));

    if (attachmentFlag === "Yes" && attachmentFile) {
      formData.append("attachment", attachmentFile);
    }

    try {
      await axios.put(`http://localhost:8080/api/task/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Task updated successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/tasks/${id}`, { withCredentials: true });
      alert("Task deleted successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Edit Task</h2>

      <label>Acceptance Criteria:</label>
      <textarea value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} required rows={3} />

      <label>Attachment Flag:</label>
      <select value={attachmentFlag} onChange={e => setAttachmentFlag(e.target.value)}>
        <option value="">-- Select --</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      {attachmentFlag === "Yes" && (
        <>
          <label>Attachment:</label>
          {existingAttachmentName && <p>Current File: {existingAttachmentName}</p>}
          <input type="file" onChange={e => setAttachmentFile(e.target.files[0])} />
        </>
      )}

      <label>Sprint:</label>
      <select value={selectedSprint} onChange={handleSelectChange(setSelectedSprint)} required>
        <option value="">-- Select Sprint --</option>
        {sprints.map(s => (
          <option key={s.id} value={s.id}>{s.sprintName || `Sprint ${s.id}`}</option>
        ))}
      </select>

      <label>Story Points:</label>
      <input type="number" min="0" value={storypoints} onChange={e => setStorypoints(e.target.value)} />

      <label>User Story:</label>
      <input type="text" value={userstory} onChange={e => setUserstory(e.target.value)} required />

      <label>Description:</label>
      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />

      <label>Feature:</label>
      <select value={selectedFeature} onChange={handleSelectChange(setSelectedFeature)} required>
        <option value="">-- Select Feature --</option>
        {features.map(f => (
          <option key={f.id} value={f.id}>{f.name || `Feature ${f.id}`}</option>
        ))}
      </select>

      <label>User:</label>
      <select value={selectedUser} onChange={handleSelectChange(setSelectedUser)} required>
        <option value="">-- Select User --</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.firstName || u.preffered_name || `${u.id}`}</option>
        ))}
      </select>

      <label>Reported To:</label>
      <select value={reportedTo} onChange={e => setReportedTo(e.target.value)} required>
        <option value="">Select Manager</option>
        {managers.map(manager => (
          <option key={manager.id} value={manager.id}>{manager.preffered_name}</option>
        ))}
      </select>

      <label>Start Date:</label>
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />

      <label>End Date:</label>
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

      <label>Task Type:</label>
      <select value={selectedTaskType} onChange={handleSelectChange(setSelectedTaskType)} required>
        <option value="">-- Select Task Type --</option>
        {taskTypes.map(tt => (
          <option key={tt.id} value={tt.id}>{tt.description}</option>
        ))}
      </select>

      <label>Task Status:</label>
      <select value={selectedTaskStatus} onChange={e => setSelectedTaskStatus(e.target.value)} required>
        <option value="">-- Select Task Status --</option>
        {taskStatuses.map(ts => (
          <option key={ts.id} value={ts.id}>{ts.decription}</option>
        ))}
      </select>

      <div style={{ marginTop: 20, display: "flex", gap: "10px" }}>
        <button type="submit" className="task-form-button">Update Task</button>
        <button type="button" onClick={() => navigate(-1)} className="task-form-button">Back</button>
        <button type="button" onClick={handleDelete} className="task-form-button delete-button">Delete</button>
      </div>
    </form>
  );
}
