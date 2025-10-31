// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../api";
// import "./TaskForm.css";

// export default function CreateTask() {
//   const navigate = useNavigate();

//   // Dropdown states
//   const [features, setFeatures] = useState([]);
//   const [sprints, setSprints] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [managers, setManagers] = useState([]);
//   const [taskTypes, setTaskTypes] = useState([]);
//   const [taskStatuses, setTaskStatuses] = useState([]);

//   // Form states
//   const [userstory, setUserstory] = useState("");
//   const [description, setDescription] = useState("");
//   const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
//   const [storypoints, setStorypoints] = useState("");
//   const [attachmentFlag, setAttachmentFlag] = useState("No");
//   const [attachmentFile, setAttachmentFile] = useState(null);
//   const [selectedFeature, setSelectedFeature] = useState("");
//   const [selectedSprint, setSelectedSprint] = useState("");
//   const [selectedUser, setSelectedUser] = useState("");
//   const [reportedTo, setReportedTo] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [selectedTaskType, setSelectedTaskType] = useState("");
//   const [selectedTaskStatus, setSelectedTaskStatus] = useState("");

//   // Fetch dropdown data
//   useEffect(() => {
//     api.get("/features", { withCredentials: true }).then(res => setFeatures(res.data));
//     api.get("/users", { withCredentials: true }).then(res => setUsers(res.data));
//     api.get("/managers", { withCredentials: true }).then(res => setManagers(res.data));
//     api.get("/gettype", { withCredentials: true }).then(res => setTaskTypes(res.data));
//     api.get("/getstatusForTask", { withCredentials: true }).then(res => setTaskStatuses(res.data));
//   }, []);

//   // Fetch sprints when feature changes
//   useEffect(() => {
//     if (selectedFeature) {
//       api.get(`/features/${selectedFeature}/sprints`, { withCredentials: true })
//         .then(res => setSprints(res.data))
//         .catch(err => console.error(err));
//     } else {
//       setSprints([]);
//       setSelectedSprint("");
//     }
//   }, [selectedFeature]);

//   // Remove attachment
//   const removeAttachment = () => setAttachmentFile(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("userstory", userstory);
//     formData.append("description", description);
//     formData.append("acceptance_criteria", acceptanceCriteria);
//     formData.append("storypoints", storypoints ? Number(storypoints) : "");
//     formData.append("feature_id", selectedFeature ? Number(selectedFeature) : "");
//     if (selectedSprint) formData.append("sprint_id", selectedSprint);
//     formData.append("attachment_flag", attachmentFlag || "No");
//     if (attachmentFlag === "Yes" && attachmentFile) formData.append("attachment", attachmentFile);
//     if (selectedUser) formData.append("user_id", selectedUser);
//     if (reportedTo) formData.append("reportedTo", reportedTo);
//     if (selectedTaskType) formData.append("taskType_id", selectedTaskType);
//     if (selectedTaskStatus) formData.append("taskStatus_id", selectedTaskStatus);
//     if (startDate) formData.append("start_date", startDate + ":00");
//     if (endDate) formData.append("end_date", endDate + ":00");

//     try {
//       await api.post("/create", formData, {
//         withCredentials: true,
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       alert("Task created successfully!");
//       navigate(-1);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to create task.");
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="task-form" style={{ maxWidth: 600, margin: "auto" }}>
//       <button onClick={() => navigate(-1)} className="back-btn">Back</button>
//       <h2>Create Task</h2>

//       {/* Feature */}
//       <label>Feature</label>
//       <select value={selectedFeature} onChange={e => setSelectedFeature(e.target.value)} required>
//         <option value="">-- Select Feature --</option>
//         {features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
//       </select>

//       {/* Task Type */}
//       <label>Task Type</label>
//       <select value={selectedTaskType} onChange={e => setSelectedTaskType(e.target.value)} required>
//         <option value="">-- Select Task Type --</option>
//         {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.description}</option>)}
//       </select>

//       {/* User Story */}
//       <label>User Story</label>
//       <input type="text" value={userstory} onChange={e => setUserstory(e.target.value)} required />

//       {/* Description */}
//       <label>Description</label>
//       <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />

//       {/* Acceptance Criteria */}
//       <label>Acceptance Criteria</label>
//       <textarea value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} rows={3} />

//       {/* Attachment */}
//       <label>Attachment Flag</label>
//       <select value={attachmentFlag} onChange={e => setAttachmentFlag(e.target.value)}>
//         <option value="No">No</option>
//         <option value="Yes">Yes</option>
//       </select>

//       {attachmentFlag === "Yes" && (
//   <div className="attachment-container">
//     <label>Attachment:</label>
//     <input
//       type="file"
//       onChange={e => setAttachmentFile(e.target.files[0])}
//     />
//           {attachmentFile && (
//             <div className="attachment-file">
//               <span>{attachmentFile.name}</span>
//               <button
//                 type="button"
//                 className="remove-btn"
//                 onClick={() => setAttachmentFile(null)}
//               >
//                 ✖
//               </button>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Story Points */}
//       <label>Story Points</label>
//       <input type="number" min="0" value={storypoints} onChange={e => setStorypoints(e.target.value)} />

//       {/* Start/End Date */}
//       <label>Start Date</label>
//       <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
//       <label>End Date</label>
//       <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />

//       {/* User */}
//       <label>User</label>
//       <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
//         <option value="">-- Select User --</option>
//         {users.map(u => <option key={u.id} value={u.id}>{u.first_name}</option>)}
//       </select>

//       {/* Reported To */}
//       <label>Reported To</label>
//       <select value={reportedTo} onChange={e => setReportedTo(e.target.value)}>
//         <option value="">-- Select Manager --</option>
//         {managers.map(m => <option key={m.id} value={m.id}>{m.preffered_name}</option>)}
//       </select>

//       {/* Sprint (Optional) */}
//       <label>Sprint (Optional)</label>
//       <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)} disabled={!selectedFeature}>
//         <option value="">-- Select Sprint --</option>
//         {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//       </select>

//       {/* Task Status */}
//       <label>Task Status</label>
//       <select value={selectedTaskStatus} onChange={e => setSelectedTaskStatus(e.target.value)} required>
//         <option value="">-- Select Task Status --</option>
//         {taskStatuses.map(ts => <option key={ts.id} value={ts.id}>{ts.decription}</option>)}
//       </select>

//       <button type="submit" style={{ marginTop: 20, padding: "10px 20px" }}>Create Task</button>
//     </form>
//   );
// }


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./TaskForm.css";

export default function CreateTask() {
  const navigate = useNavigate();

  // Dropdown states
  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);

  // Form states
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [reportedTo, setReportedTo] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [selectedTaskStatus, setSelectedTaskStatus] = useState("");
  const [userstory, setUserstory] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [storypoints, setStorypoints] = useState("");
  const [attachmentFlag, setAttachmentFlag] = useState("No");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch dropdown data
  useEffect(() => {
    api.get("/projects", { withCredentials: true }).then(res => setProjects(res.data));
    api.get("/users", { withCredentials: true }).then(res => setManagers(res.data));
    api.get("/gettype", { withCredentials: true }).then(res => setTaskTypes(res.data));
    api.get("/getstatusForTask", { withCredentials: true }).then(res => setTaskStatuses(res.data));
  }, []);

  // Fetch features when project changes
  useEffect(() => {
  if (selectedProject) {
    // Fetch features for selected project
    api.get(`/features/project/${selectedProject}`, { withCredentials: true })
      .then(res => setFeatures(res.data))
      .catch(err => console.error(err));

    // Fetch users for selected project
    api.get(`/project/users/${selectedProject}`, { withCredentials: true })
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  } else {
    setFeatures([]);
    setUsers([]);
    setSelectedFeature("");
    setSelectedUser("");
  }
}, [selectedProject]);
  // Fetch sprints when feature changes
  useEffect(() => {
    if (selectedFeature) {
      api.get(`/features/${selectedFeature}/sprints`, { withCredentials: true })
        .then(res => setSprints(res.data))
        .catch(err => console.error(err));
    } else {
      setSprints([]);
      setSelectedSprint("");
    }
  }, [selectedFeature]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("userstory", userstory);
    formData.append("description", description);
    formData.append("acceptance_criteria", acceptanceCriteria);
    formData.append("storypoints", storypoints ? Number(storypoints) : "");
    formData.append("feature_id", selectedFeature ? Number(selectedFeature) : "");
    if (selectedSprint) formData.append("sprint_id", selectedSprint);
    formData.append("attachment_flag", attachmentFlag || "No");
    if (attachmentFlag === "Yes" && attachmentFile) formData.append("attachment", attachmentFile);
    if (selectedUser) formData.append("user_id", selectedUser);
    if (reportedTo) formData.append("reportedTo", reportedTo);
    if (selectedTaskType) formData.append("taskType_id", selectedTaskType);
    if (selectedTaskStatus) formData.append("taskStatus_id", selectedTaskStatus);
    if (startDate) formData.append("start_date", startDate + ":00");
    if (endDate) formData.append("end_date", endDate + ":00");

    try {
      await api.post("/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Task created successfully!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Failed to create task.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <button onClick={() => navigate(-1)} type="button" className="back-btn">Back</button>
      <h2>Create Task</h2>

      {/* Project */}
      <div className="form-group">
        <label>Project</label>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} required>
          <option value="">-- Select Project --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Feature */}
      <div className="form-group">
        <label>Feature</label>
        <select value={selectedFeature} onChange={e => setSelectedFeature(e.target.value)} disabled={!selectedProject} required>
          <option value="">-- Select Feature --</option>
          {features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* Task Type */}
      <div className="form-group">
        <label>Task Type</label>
        <select value={selectedTaskType} onChange={e => setSelectedTaskType(e.target.value)} required>
          <option value="">-- Select Task Type --</option>
          {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.description}</option>)}
        </select>
      </div>

      {/* Task Status */}
      <div className="form-group">
        <label>Task Status</label>
        <select value={selectedTaskStatus} onChange={e => setSelectedTaskStatus(e.target.value)} required>
          <option value="">-- Select Task Status --</option>
          {taskStatuses.map(ts => <option key={ts.id} value={ts.id}>{ts.decription}</option>)}
        </select>
      </div>

      {/* User Story */}
      <div className="form-group full-width">
        <label>User Story</label>
        <input type="text" value={userstory} onChange={e => setUserstory(e.target.value)} required />
      </div>

      {/* Description */}
      <div className="form-group full-width">
        <label>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
      </div>

      {/* Acceptance Criteria */}
      <div className="form-group full-width">
        <label>Acceptance Criteria</label>
        <textarea value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} rows={3} />
      </div>

      {/* Story Points */}
      <div className="form-group">
        <label>Story Points</label>
        <input type="number" min="0" value={storypoints} onChange={e => setStorypoints(e.target.value)} />
      </div>

      {/* Sprint */}
      <div className="form-group">
        <label>Sprint (Optional)</label>
        <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)} disabled={!selectedFeature}>
          <option value="">-- Select Sprint --</option>
          {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Start/End Dates */}
      <div className="form-group">
        <label>Start Date</label>
        <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>

      <div className="form-group">
        <label>End Date</label>
        <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {/* User */}
      <div className="form-group">
        <label>User</label>
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
          <option value="">-- Select User --</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.first_name}</option>)}
        </select>
      </div>

      {/* Reported To */}
      <div className="form-group">
        <label>Reported To</label>
        <select value={reportedTo} onChange={e => setReportedTo(e.target.value)}>
          <option value="">-- Select Manager --</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.preffered_name}</option>)}
        </select>
      </div>

      {/* Attachment */}
      <div className="form-group">
        <label>Attachment Flag</label>
        <select value={attachmentFlag} onChange={e => setAttachmentFlag(e.target.value)}>
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>

      {attachmentFlag === "Yes" && (
        <div className="form-group full-width attachment-container">
          <label>Attachment</label>
          <input type="file" onChange={e => setAttachmentFile(e.target.files[0])} />
          {attachmentFile && (
            <div className="attachment-file">
              <span>{attachmentFile.name}</span>
              <button type="button" className="remove-btn" onClick={() => setAttachmentFile(null)}>✖</button>
            </div>
          )}
        </div>
      )}

      <div className="btn-container full-width">
        <button type="submit">Create Task</button>
      </div>
    </form>
  );
}