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
import { sortAlphabetically, sortLatestFirst, sortStatuses } from "../utils/sortUtils";
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
  const [complexity, setComplexity] = useState("");
  const [attachmentFlag, setAttachmentFlag] = useState("No");
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch dropdown data
  useEffect(() => {
    api.get("/projects", { withCredentials: true }).then(res => setProjects(sortLatestFirst(res.data)));
    api.get("/users", { withCredentials: true }).then(res => setManagers(sortAlphabetically(res.data)));
    api.get("/gettype", { withCredentials: true }).then(res => setTaskTypes(res.data));
    api.get("/getstatusForTask", { withCredentials: true }).then(res => setTaskStatuses(sortStatuses(res.data)));
  }, []);

  // Fetch features when project changes
  useEffect(() => {
  if (selectedProject) {
    // Fetch features for selected project
    api.get(`/features/project/${selectedProject}`, { withCredentials: true })
      .then(res => {
        // Exclude features that are "Completed" or "DONE"
        const activeFeatures = res.data.filter(f => 
          f.status?.decription !== "Completed" && 
          f.status?.decription !== "DONE" &&
          f.status?.decription !== "Completed "
        );
        setFeatures(sortLatestFirst(activeFeatures));
      })
      .catch(err => console.error(err));

    // Fetch users for selected project
    api.get(`/project/users/${selectedProject}`, { withCredentials: true })
      .then(res => setUsers(sortAlphabetically(res.data)))
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
    if (selectedProject) {
      api.get(`/project/activeSprints/${selectedProject}`, { withCredentials: true })
        .then(res => setSprints(sortLatestFirst(res.data)))
        .catch(err => console.error(err));
    } else {
      setSprints([]);
      setSelectedSprint("");
    }
 }, [selectedProject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("userstory", userstory);
    formData.append("description", description);
    formData.append("acceptance_criteria", acceptanceCriteria);
    formData.append("storypoints", storypoints ? Number(storypoints) : "");
    formData.append("complexity", complexity ? Number(complexity) : "");
    formData.append("feature_id", selectedFeature ? Number(selectedFeature) : "");
    if (selectedSprint) formData.append("sprint_id", selectedSprint);
    
    const flag = attachmentFiles.length > 0 ? "Yes" : "No";
    formData.append("attachment_flag", flag);
    
    if (attachmentFiles.length > 0) {
      attachmentFiles.forEach(file => {
        formData.append("attachment", file);
      });
    }

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
      navigate(`/task?project=${selectedProject}&feature=${selectedFeature}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create task.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>

      {/* Row 1: First 4 Fields */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Project<sup style={{color: "red"}}>*</sup></label>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} required>
          <option value="">-- Select Project --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Feature<sup style={{color: "red"}}>*</sup></label>
        <select value={selectedFeature} onChange={e => setSelectedFeature(e.target.value)} disabled={!selectedProject} required>
          <option value="">-- Select Feature --</option>
          {features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Task Type<sup style={{color: "red"}}>*</sup></label>
        <select value={selectedTaskType} onChange={e => setSelectedTaskType(e.target.value)} required>
          <option value="">-- Select Task Type --</option>
          {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.description}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Task Status<sup style={{color: "red"}}>*</sup></label>
        <select value={selectedTaskStatus} onChange={e => setSelectedTaskStatus(e.target.value)} required>
          <option value="">-- Select Task Status --</option>
          {taskStatuses.map(ts => <option key={ts.id} value={ts.id}>{ts.decription}</option>)}
        </select>
      </div>

      {/* Text Areas */}
      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>User Story<sup style={{color: "red"}}>*</sup></label>
        <textarea value={userstory} onChange={e => setUserstory(e.target.value)} rows={2} style={{ minHeight: '34px', padding: '8px' }} maxLength={255} required />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ minHeight: '34px', padding: '8px' }} maxLength={255} />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Acceptance Criteria</label>
        <textarea value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} rows={2} style={{ minHeight: '34px', padding: '8px' }} maxLength={255} />
      </div>

      {/* Row 2: Next 3 Fields */}
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>User</label>
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
          <option value="">-- Select User --</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.first_name}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Reported To</label>
        <select value={reportedTo} onChange={e => setReportedTo(e.target.value)}>
          <option value="">-- Select Manager --</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.preffered_name}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Complexity<sup style={{color: "red"}}>*</sup></label>
        <input
          type="number"
          min="1"
          max="5"
          placeholder="(1 to 5)"
          value={complexity}
          onChange={(e) => setComplexity(e.target.value)}
          required
        />
      </div>

      {/* Row 3: Next 4 Fields */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Story Points<sup style={{color: "red"}}>*</sup></label>
        <input type="number" min="1" value={storypoints} onChange={e => setStorypoints(e.target.value)} required />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Start Date</label>
        <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>End Date</label>
        <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Sprint (Optional)</label>
        <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)} disabled={!selectedFeature}>
          <option value="">-- Select Sprint --</option>
          {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Attachments - Bug Style */}
      <div className="form-group attachment-container" style={{ gridColumn: 'span 12', margin: 0 }}>
        <label>Attachments:</label>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={e => {
              const files = Array.from(e.target.files);
              setAttachmentFiles(prev => [...prev, ...files]);
              e.target.value = null; // reset input
            }} style={{ padding: '4px' }} />
          </div>
          <div style={{ flex: 1 }}>
            {attachmentFiles.length > 0 && (
              <ul className="file-list" style={{ marginTop: 0 }}>
                {attachmentFiles.map((file, index) => (
                  <li key={index} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', padding: '2px 8px' }}>
                    <span style={{ fontSize: '13px' }}>📎 {file.name}</span>
                    <button type="button" className="remove-btn" onClick={() => setAttachmentFiles(prev => prev.filter((_, i) => i !== index))} style={{ width: '16px', height: '16px', fontSize: '10px' }}>❌</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="btn-container full-width" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button type="submit" className="btn-global btn-primary">Create Task</button>
      </div>
    </form>
  );
}