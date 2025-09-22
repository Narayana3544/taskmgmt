import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '../api';
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
  const [existingAttachmentName, setExistingAttachmentName] = useState("");
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

  useEffect(() => {
    // Fetch task details
    api.get(`/view-task/${id}`, { withCredentials: true })
      .then(res => {
        const task = res.data;
        setAcceptanceCriteria(task.acceptance_criteria || "");
        setStorypoints(task.storypoints || "");
        setUserstory(task.userstory || "");
        setDescription(task.description || "");
        setStartDate(task.start_date ? task.start_date.slice(0,16) : ""); // for datetime-local input
        setEndDate(task.end_date ? task.end_date.slice(0,16) : "");
        setSelectedSprint(task.sprint?.id || "");
        setSelectedFeature(task.feature?.id || "");
        setSelectedUser(task.user?.id || "");
        setReportedTo(task.reportedTo?.id || "");
        setSelectedTaskType(task.taskType?.id || "");
        setSelectedTaskStatus(task.taskStatus?.id || "");
        if (task.attachment_flag === "Yes" && task.attachmentName) {
          setAttachmentFlag("Yes");
          setExistingAttachmentName(task.attachmentName);
        } else {
          setAttachmentFlag("No");
        }
      })
      .catch(err => console.error("Failed to load task:", err));

    // Fetch dropdown data
    api.get("/users", { withCredentials: true }).then(res => setUsers(res.data));
    api.get("/features", { withCredentials: true }).then(res => setFeatures(res.data));
    api.get("/gettype", { withCredentials: true }).then(res => setTaskTypes(res.data));
    api.get("/getstatusForTask", { withCredentials: true }).then(res => setTaskStatuses(res.data));
    api.get("/managers", { withCredentials: true }).then(res => setManagers(res.data));
    if (selectedFeature) {
      api.get(`/features/${selectedFeature}/sprints`, { withCredentials:true })
        .then(res => setSprints(res.data))
        .catch(err => console.error(err));
    }
  }, [id, selectedFeature]);

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
      await api.put(`/task/${id}`, formData, {
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
      await api.delete(`/tasks/${id}`, { withCredentials: true });
      alert("Task deleted successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task.");
    }
  };

  return (
    <div className="home">
      <form onSubmit={handleSubmit} className="task-form" style={{ maxWidth: 600, margin: "auto" }}>
        <button onClick={() => navigate(-1)} className="back-btn">Back</button>
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
          <div className="attachment-container">
            {existingAttachmentName && !attachmentFile && (
              <div className="attachment-file">
                <span>{existingAttachmentName}</span>
                <button type="button" className="remove-btn" onClick={() => setExistingAttachmentName("")}>✖</button>
              </div>
            )}
            <input type="file" onChange={e => setAttachmentFile(e.target.files[0])} />
            {attachmentFile && (
              <div className="attachment-file">
                <span>{attachmentFile.name}</span>
                <button type="button" className="remove-btn" onClick={() => setAttachmentFile(null)}>✖</button>
              </div>
            )}
          </div>
        )}

        <label>Sprint:</label>
        <select value={selectedSprint} onChange={handleSelectChange(setSelectedSprint)}>
          <option value="">-- Select Sprint --</option>
          {sprints.map(s => <option key={s.id} value={s.id}>{s.name || `Sprint ${s.id}`}</option>)}
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
          {features.map(f => <option key={f.id} value={f.id}>{f.name || `Feature ${f.id}`}</option>)}
        </select>

        <label>User:</label>
        <select value={selectedUser} onChange={handleSelectChange(setSelectedUser)}>
          <option value="">-- Select User --</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.firstName || u.preffered_name || `${u.id}`}</option>)}
        </select>

        <label>Reported To:</label>
        <select value={reportedTo} onChange={e => setReportedTo(e.target.value)} >
          <option value="">Select Manager</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.preffered_name}</option>)}
        </select>

        <label>Start Date:</label>
        <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />

        <label>End Date:</label>
        <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />

        <label>Task Type:</label>
        <select value={selectedTaskType} onChange={handleSelectChange(setSelectedTaskType)} required>
          <option value="">-- Select Task Type --</option>
          {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.description}</option>)}
        </select>

        <label>Task Status:</label>
        <select value={selectedTaskStatus} onChange={handleSelectChange(setSelectedTaskStatus)} required>
          <option value="">-- Select Task Status --</option>
          {taskStatuses.map(ts => <option key={ts.id} value={ts.id}>{ts.decription}</option>)}
        </select>

        <div style={{ marginTop: 20, display: "flex", gap: "10px" }}>
          <button type="submit" className="task-form-button">Update Task</button>
          <button type="button" onClick={() => navigate(-1)} className="task-form-button">Back</button>
          <button type="button" onClick={handleDelete} className="task-form-button delete-button">Delete</button>
        </div>
      </form>
    </div>
  );
}
