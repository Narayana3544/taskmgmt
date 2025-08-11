// import React, { useState, useEffect } from "react";
// import axios from "axios";

// export default function CreateTask() {
//   const [users, setUsers] = useState([]);
//   const [sprints, setSprints] = useState([]);
//   const [statuses, setStatuses] = useState([]);
//   const [stories, setStories] = useState([]);

//   const [selectedUser, setSelectedUser] = useState("");
//   const [selectedSprint, setSelectedSprint] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState("");
//   const [selectedStory, setSelectedStory] = useState("");
//   const [taskName, setTaskName] = useState("");

//   useEffect(() => {
//     axios
//       .get("http://localhost:8080/api/users", { withCredentials: true })
//       .then(res => {
//         console.log("Users data:", res.data);
//         setUsers(res.data);
//       })
//       .catch(err => console.error("Error fetching users:", err));

//     axios
//       .get("http://localhost:8080/api/sprints", { withCredentials: true })
//       .then(res => {
//         console.log("Sprints data:", res.data);
//         setSprints(res.data);
//       })
//       .catch(err => console.error("Error fetching sprints:", err));

//     axios
//       .get("http://localhost:8080/api/getstatus", { withCredentials: true })
//       .then(res => {
//         console.log("Statuses data:", res.data);
//         setStatuses(res.data);
//       })
//       .catch(err => console.error("Error fetching statuses:", err));

//     axios
//       .get("http://localhost:8080/api/features/userstories", { withCredentials: true })
//       .then(res => {
//         console.log("Stories data:", res.data);
//         setStories(res.data);
//       })
//       .catch(err => console.error("Error fetching stories:", err));
//   }, []);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const taskData = {
//       name: taskName,
//       assignedUserId: selectedUser,
//       sprintId: selectedSprint,
//       statusId: selectedStatus,
//       storyId: selectedStory,
//     };

//     axios
//       .post("http://localhost:8080/api/createtask", taskData, { withCredentials: true })
//       .then(res => {
//         console.log("Task saved:", res.data);
//         alert("Task created successfully!");
//       })
//       .catch(err => {
//         console.error("Error saving task:", err);
//         alert("Failed to create task.");
//       });
//   };

//   return (
//     <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "auto" }}>
//       <h2>Create Task</h2>

//       <label>Task Name:</label>
//       <input
//         type="text"
//         value={taskName}
//         onChange={(e) => setTaskName(e.target.value)}
//         required
//       />

//       <label>Assign User:</label>
//       <select
//         value={selectedUser}
//         onChange={(e) => setSelectedUser(e.target.value)}
//         required
//       >
//         <option value="">-- Select User --</option>
//         {users.map(user => (
//           <option key={user.id} value={user.id}>
//             {user.first_name} {user.last_name}
//           </option>
//         ))}
//       </select>

//       <label>Sprint:</label>
//       <select
//         value={selectedSprint}
//         onChange={(e) => setSelectedSprint(e.target.value)}
//         required
//       >
//         <option value="">-- Select Sprint --</option>
//         {sprints.map(sprint => (
//           <option key={sprint.id} value={sprint.id}>
//             {sprint.sprintName || sprint.name}
//           </option>
//         ))}
//       </select>

//       <label>Status:</label>
//       <select
//         value={selectedStatus}
//         onChange={(e) => setSelectedStatus(e.target.value)}
//         required
//       >
//         <option value="">-- Select Status --</option>
//         {statuses.map(status => (
//           <option key={status.id} value={status.id}>
//             {status.decription} {/* spelling matches your API */}
//           </option>
//         ))}
//       </select>

//       <label>User Story:</label>
//       <select
//         value={selectedStory}
//         onChange={(e) => setSelectedStory(e.target.value)}
//         required
//       >
//         <option value="">-- Select Story --</option>
//         {stories.map(story => (
//           <option key={story.id} value={story.id}>
//             {story.description}
//           </option>
//         ))}
//       </select>

//       <button type="submit">Create Task</button>

//       {/* Inline style to make sure text is visible */}
//       <style>{`
//         select, option, input, button {
//           display: block;
//           width: 100%;
//           padding: 8px;
//           margin: 8px 0;
//           color: black;
//           background-color: white;
//         }
//       `}</style>
//     </form>
//   );
// }
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TaskForm.css";

export default function CreateTask() {
  // Dropdown data states
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [features, setFeatures] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);

  // Form input states
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [attachmentFlag, setAttachmentFlag] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [storypoints, setStorypoints] = useState("");
  const [userstory, setUserstory] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [selectedTaskStatus, setSelectedTaskStatus] = useState("");

  // Fetch dropdown data on mount
  useEffect(() => {
    axios
      .get("http://localhost:8080/api/users", { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch(console.error);
    axios
      .get("http://localhost:8080/api/sprints", { withCredentials: true })
      .then((res) => setSprints(res.data))
      .catch(console.error);
    axios
      .get("http://localhost:8080/api/features", { withCredentials: true })
      .then((res) => setFeatures(res.data))
      .catch(console.error);
    axios
      .get("http://localhost:8080/api/gettype", { withCredentials: true })
      .then((res) => setTaskTypes(res.data))
      .catch(console.error);
    axios
      .get("http://localhost:8080/api/getstatus", { withCredentials: true })
      .then((res) => setTaskStatuses(res.data))
      .catch(console.error);
  }, []);

  // Helper to convert dropdown values to numbers or empty string
  const handleSelectChange = (setter) => (e) => {
    const val = e.target.value;
    setter(val ? Number(val) : "");
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();

    const taskData = {
      acceptance_criteria: acceptanceCriteria,
      attachment_flag: attachmentFlag,
      sprint_id: selectedSprint || null,
      storypoints: storypoints ? Number(storypoints) : null,
      userstory: userstory,
      description: description,
      feature_id: selectedFeature || null,
      user_id: selectedUser || null,
      start_date: startDate || null,
      end_date: endDate || null,
      task_type_id: selectedTaskType || null,
      task_status: selectedTaskStatus || null,
    };


        console.log("Submitting taskData:", JSON.stringify(taskData, null, 2));
    axios
      .post("http://localhost:8080/api/create-task", taskData, { withCredentials: true })
      .then(() => {
        alert("Task created successfully!");
        // Clear form inputs
        setAcceptanceCriteria("");
        setAttachmentFlag("");
        setSelectedSprint("");
        setStorypoints("");
        setUserstory("");
        setDescription("");
        setSelectedFeature("");
        setSelectedUser("");
        setStartDate("");
        setEndDate("");
        setSelectedTaskType("");
        setSelectedTaskStatus("");
      })
      .catch((err) => {
        console.error("Error creating task:", err);
        alert("Failed to create task.");
      });
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Create Task</h2>

      <label>Acceptance Criteria:</label>
      <textarea
        value={acceptanceCriteria}
        onChange={(e) => setAcceptanceCriteria(e.target.value)}
        required
        rows={3}
        style={{ width: "100%" }}
      />

      <label>Attachment Flag:</label>
      <input
        type="text"
        value={attachmentFlag}
        onChange={(e) => setAttachmentFlag(e.target.value)}
      />

      <label>Sprint:</label>
      <select value={selectedSprint} onChange={handleSelectChange(setSelectedSprint)} required>
        <option value="">-- Select Sprint --</option>
        {sprints.map((s) => (
          <option key={s.id} value={s.id}>
            {s.sprintName || s.name || `Sprint ${s.id}`}
          </option>
        ))}
      </select>

      <label>Story Points:</label>
      <input
        type="number"
        min="0"
        value={storypoints}
        onChange={(e) => setStorypoints(e.target.value)}
      />

      <label>User Story:</label>
      <input
        type="text"
        value={userstory}
        onChange={(e) => setUserstory(e.target.value)}
        required
      />

      <label>Description:</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
      />

      <label>Feature:</label>
      <select value={selectedFeature} onChange={handleSelectChange(setSelectedFeature)} required>
        <option value="">-- Select Feature --</option>
        {features.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name || `Feature ${f.id}`}
          </option>
        ))}
      </select>

      <label>User:</label>
      <select value={selectedUser} onChange={handleSelectChange(setSelectedUser)} required>
        <option value="">-- Select User --</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.firstName || u.preffered_name || `${u.id}`}
          </option>
        ))}
      </select>

      <label>Start Date:</label>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

      <label>End Date:</label>
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

      <label>Task Type:</label>
      <select value={selectedTaskType} onChange={handleSelectChange(setSelectedTaskType)} required>
        <option value="">-- Select Task Type --</option>
        {taskTypes.map((tt) => (
          <option key={tt.id} value={tt.id}>
            {tt.description}
          </option>
        ))}
      </select>

      <label>Task Status:</label>
      <select value={selectedTaskStatus} onChange={handleSelectChange(setSelectedTaskStatus)} required>
        <option value="">-- Select Task Status --</option>
        {taskStatuses.map((ts) => (
          <option key={ts.id} value={ts.id}>
            {ts.description || `Status ${ts.id}`}
          </option>
        ))}
      </select>

      <button type="submit" style={{ marginTop: 20, padding: "10px 20px" }}>
        Create Task
      </button>
    </form>
  );
}


