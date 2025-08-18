// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "./TaskForm.css";

// export default function CreateTask() {
//   // Dropdown data states
//   const [users, setUsers] = useState([]);
//   const [sprints, setSprints] = useState([]);
//   const [features, setFeatures] = useState([]);
//   const [taskTypes, setTaskTypes] = useState([]);
//   const [taskStatuses, setTaskStatuses] = useState([]);

//   // Form input states
//   const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
//   const [attachmentFlag, setAttachmentFlag] = useState("");
//   const [selectedSprint, setSelectedSprint] = useState("");
//   const [storypoints, setStorypoints] = useState("");
//   const [userstory, setUserstory] = useState("");
//   const [description, setDescription] = useState("");
//   const [selectedFeature, setSelectedFeature] = useState("");
//   const [selectedUser, setSelectedUser] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [selectedTaskType, setSelectedTaskType] = useState("");
//   const [selectedTaskStatus, setSelectedTaskStatus] = useState("");
//   const [managers, setManagers] = useState([]);
//   const [reportedTo, setReportedTo] = useState("");

//   // Fetch dropdown data on mount
// const navigate = useNavigate();

//   useEffect(() => {
//     axios
//       .get("http://localhost:8080/api/users", { withCredentials: true })
//       .then((res) => setUsers(res.data))
//       .catch(console.error);
//     axios
//       .get("http://localhost:8080/api/sprints", { withCredentials: true })
//       .then((res) => setSprints(res.data))
//       .catch(console.error);
//     axios
//       .get("http://localhost:8080/api/features", { withCredentials: true })
//       .then((res) => setFeatures(res.data))
//       .catch(console.error);
//     axios
//       .get("http://localhost:8080/api/gettype", { withCredentials: true })
//       .then((res) => setTaskTypes(res.data))
//       .catch(console.error);
//       axios
//         .get("http://localhost:8080/api/getstatus", { withCredentials: true })
//         .then((res) => {
//         console.log("Statuses from API:", res.data);
//         setTaskStatuses(res.data);
//       axios.get("http://localhost:8080/api/managers",{withCredentials:true})
//       .then((res) => setManagers(res.data))
//       .catch(err => console.error(err));
//     })
//       .catch(console.error);
//       }, []);

//   // Helper to convert dropdown values to numbers or empty string
//   const handleSelectChange = (setter) => (e) => {
//     const val = e.target.value;
//     setter(val ? Number(val) : "");
//   };

//   // Form submit handler
//   const handleSubmit = (e) => {
//     e.preventDefault();

//    const taskData = {
//   acceptance_criteria: acceptanceCriteria,
//   attachment_flag: attachmentFlag,
//   storypoints: storypoints ? Number(storypoints) : null,
//   userstory: userstory,
//   description: description,
//   start_date: startDate || null,
//   end_date: endDate || null,
//   sprint: selectedSprint ? { id: Number(selectedSprint) } : null,
//   feature: selectedFeature ? { id: Number(selectedFeature) } : null,
//   user: selectedUser ? { id: Number(selectedUser) } : null,
//   taskType: selectedTaskType ? { id: Number(selectedTaskType) } : null,
//   taskStatus: selectedTaskStatus ? { id: Number(selectedTaskStatus) } : null,
//   reportedTo: reportedTo ? { id: Number(reportedTo) } : null,
// };



//         console.log("Submitting taskData:", JSON.stringify(taskData, null, 2));
//     axios
//       .post("http://localhost:8080/api/create-task", taskData, { withCredentials: true })
//       .then(() => {
//         navigate(-1);
//         alert("Task created successfully!");
//         // Clear form inputs
//         setAcceptanceCriteria("");
//         setAttachmentFlag("");
//         setSelectedSprint("");
//         setStorypoints("");
//         setUserstory("");
//         setDescription("");
//         setSelectedFeature("");
//         setSelectedUser("");
//         setStartDate("");
//         setEndDate("");
//         setSelectedTaskType("");
//         setSelectedTaskStatus("");
//       })
//       .catch((err) => {
//         console.error("Error creating task:", err);
//         alert("Failed to create task.");
//       });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="task-form" style={{ maxWidth: 600, margin: "auto" }}>
//       <h2>Create Task</h2>

//       <label>Acceptance Criteria:</label>
//       <textarea
//         value={acceptanceCriteria}
//         onChange={(e) => setAcceptanceCriteria(e.target.value)}
//         required
//         rows={3}
//         style={{ width: "100%" }}
//       />

//       <label>Attachment Flag:</label>
//       <input
//         type="text"
//         value={attachmentFlag}
//         onChange={(e) => setAttachmentFlag(e.target.value)}
//       />

//       <label>Sprint:</label>
//       <select value={selectedSprint} onChange={handleSelectChange(setSelectedSprint)} required>
//         <option value="">-- Select Sprint --</option>
//         {sprints.map((s) => (
//           <option key={s.id} value={s.id}>
//             {s.sprintName || s.name || `Sprint ${s.id}`}
//           </option>
//         ))}
//       </select>

//       <label>Story Points:</label>
//       <input
//         type="number"
//         min="0"
//         value={storypoints}
//         onChange={(e) => setStorypoints(e.target.value)}
//       />

//       <label>User Story:</label>
//       <input
//         type="text"
//         value={userstory}
//         onChange={(e) => setUserstory(e.target.value)}
//         required
//       />

//       <label>Description:</label>
//       <textarea
//         value={description}
//         onChange={(e) => setDescription(e.target.value)}
//         rows={4}
//         style={{ width: "100%" }}
//       />

//       <label>Feature:</label>
//       <select value={selectedFeature} onChange={handleSelectChange(setSelectedFeature)} required>
//         <option value="">-- Select Feature --</option>
//         {features.map((f) => (
//           <option key={f.id} value={f.id}>
//             {f.name || `Feature ${f.id}`}
//           </option>
//         ))}
//       </select>

//       <label>User:</label>
//       <select value={selectedUser} onChange={handleSelectChange(setSelectedUser)} required>
//         <option value="">-- Select User --</option>
//         {users.map((u) => (
//           <option key={u.id} value={u.id}>
//             {u.firstName || u.preffered_name || `${u.id}`}
//           </option>
//         ))}
//       </select>

//        <label>Reported To:</label>
//       <select
//         value={reportedTo}
//         onChange={(e) => setReportedTo(e.target.value)}
//         required
//       >
//         <option value="">Select Manager</option>
//         {managers.map(manager => (
//           <option key={manager.id} value={manager.id}>
//             {manager.preffered_name}
//           </option>
//         ))}
//       </select>

//       <label>Start Date:</label>
//       <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

//       <label>End Date:</label>
//       <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

//       <label>Task Type:</label>
//       <select value={selectedTaskType} onChange={handleSelectChange(setSelectedTaskType)} required>
//         <option value="">-- Select Task Type --</option>
//         {taskTypes.map((tt) => (
//           <option key={tt.id} value={tt.id}>
//             {tt.description}
//           </option>
//         ))}
//       </select>

//       <label>Task Status:</label>
//      <select
//         name="taskStatus"
//         value={selectedTaskStatus} // This will store the ID
//         onChange={(e) => setSelectedTaskStatus(e.target.value)}
//         required
//       >
//         <option value="">-- Select Task Status --</option>
//         {taskStatuses.map((ts) => (
//           <option key={ts.id} value={ts.id}>
//             {ts.decription} {/* Show description, send ID */}
//           </option>
//         ))}
//       </select>
//       <button type="submit" style={{ marginTop: 20, padding: "10px 20px" }}>
//         Create Task
//       </button>
      
//     </form>
//   );
// }








import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TaskForm.css";

export default function CreateTask() {
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

  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8080/api/users", { withCredentials: true }).then(res => setUsers(res.data));
    axios.get("http://localhost:8080/api/sprints", { withCredentials: true }).then(res => setSprints(res.data));
    axios.get("http://localhost:8080/api/features", { withCredentials: true }).then(res => setFeatures(res.data));
    axios.get("http://localhost:8080/api/gettype", { withCredentials: true }).then(res => setTaskTypes(res.data));
    axios.get("http://localhost:8080/api/getstatus", { withCredentials: true }).then(res => setTaskStatuses(res.data));
    axios.get("http://localhost:8080/api/managers", { withCredentials: true }).then(res => setManagers(res.data));
  }, []);

  const handleSelectChange = setter => e => {
    const val = e.target.value;
    setter(val ? Number(val) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build task object
    const taskObj = {
        acceptance_criteria: acceptanceCriteria,
        storypoints: storypoints ? Number(storypoints) : null,
        userstory: userstory,
        description: description,
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
    // append task JSON
    formData.append(
      "task",
      new Blob([JSON.stringify(taskObj)], { type: "application/json" })
    );

    // append file if needed
    if (attachmentFlag === "Yes" && attachmentFile) {
      formData.append("attachment", attachmentFile);
    }

    try {
      await axios.post("http://localhost:8080/api/create-task-attach", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Task created successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Create Task</h2>

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

      <button type="submit" style={{ marginTop: 20, padding: "10px 20px" }}>
        Create Task
      </button>
    </form>
  );
}

