import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { sortAlphabetically, sortLatestFirst } from "../utils/sortUtils";
import "./TaskForm.css";

export default function EditTask() {
  const { id } = useParams();
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
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch dropdown data
  useEffect(() => {
    api.get("/projects", { withCredentials: true }).then((res) => setProjects(sortLatestFirst(res.data)));
    api.get("/users", { withCredentials: true }).then((res) => setManagers(sortAlphabetically(res.data)));
    api.get("/gettype", { withCredentials: true }).then((res) => setTaskTypes(res.data));
    api.get("/getstatusForTask", { withCredentials: true }).then((res) => setTaskStatuses(res.data));
  }, []);

  // Fetch existing task details
  useEffect(() => {
    api
      .get(`/view-task/${id}`, { withCredentials: true })
      .then((res) => {
        const t = res.data;
        setUserstory(t.userstory || "");
        setDescription(t.description || "");
        setAcceptanceCriteria(t.acceptance_criteria || "");
        setStorypoints(t.storypoints || "");
        setComplexity(t.complexity || "");
        setStartDate(t.start_date ? t.start_date.slice(0, 16) : "");
        setEndDate(t.end_date ? t.end_date.slice(0, 16) : "");

        setSelectedTaskType(t.taskType?.id || "");
        setSelectedTaskStatus(t.taskStatus?.id || "");
        setReportedTo(t.reportedTo?.id || "");
        setSelectedUser(t.user?.id || "");

        setSelectedFeature(t.feature?.id || "");
        setSelectedSprint(t.sprint?.id || "");
        setSelectedProject(t.feature?.project?.id || "");

        if (t.attachment_flag === "Yes") {
          setAttachmentFlag("Yes");
          if (t.attachments && t.attachments.length > 0) {
            setExistingAttachments(t.attachments);
          } else if (t.attachmentName || t.attachment_name) {
            setExistingAttachments([{ id: 'legacy', attachmentName: t.attachmentName || t.attachment_name }]);
          }
        } else {
          setAttachmentFlag("No");
          setExistingAttachments([]);
        }
      })
      .catch((err) => console.error("Error loading task:", err));
  }, [id]);

  // Fetch features & users when project changes
  useEffect(() => {
    if (selectedProject) {
      api
        .get(`/features/project/${selectedProject}`, { withCredentials: true })
        .then((res) => setFeatures(sortLatestFirst(res.data)))
        .catch(console.error);

      api
        .get(`/project/users/${selectedProject}`, { withCredentials: true })
        .then((res) => setUsers(sortAlphabetically(res.data)))
        .catch(console.error);
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
      api
        .get(`/features/${selectedFeature}/sprints`, { withCredentials: true })
        .then((res) => setSprints(sortLatestFirst(res.data)))
        .catch(console.error);
    } else {
      setSprints([]);
      setSelectedSprint("");
    }
  }, [selectedFeature]);

  // Handle update
const handleSubmit = async (e) => {
  e.preventDefault();

  // Construct the task object as your backend entity expects
  const taskData = {
    userstory,
    description,
    acceptance_criteria: acceptanceCriteria,
    storypoints: storypoints ? Number(storypoints) : null,
    complexity: complexity ? Number(complexity) : null,
    feature: selectedFeature ? { id: Number(selectedFeature) } : null,
    sprint: selectedSprint ? { id: Number(selectedSprint) } : null,
    user: selectedUser ? { id: Number(selectedUser) } : null,
    reportedTo: reportedTo ? { id: Number(reportedTo) } : null,
    taskType: selectedTaskType ? { id: Number(selectedTaskType) } : null,
    taskStatus: selectedTaskStatus ? { id: Number(selectedTaskStatus) } : null,
    start_date: startDate ? startDate + ":00" : null,
    end_date: endDate ? endDate + ":00" : null,
    attachment_flag: attachmentFlag || "No",
  };

  const formData = new FormData();
  formData.append("task", new Blob([JSON.stringify(taskData)], { type: "application/json" }));

  if (attachmentFlag === "Yes" && attachmentFiles.length > 0) {
    attachmentFiles.forEach(file => {
      formData.append("attachment", file);
    });
  }

  try {
    await api.put(`/task/${id}`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    alert("Task updated successfully!");
    navigate(-1);
  } catch (err) {
    console.error("Update failed:", err);
    alert("Failed to update task.");
  }
};

  // Handle clone
  const handleClone = async () => {
    if (!window.confirm("Are you sure you want to clone this task?")) return;
    try {
      const formData = new FormData();
      formData.append("userstory", userstory);
      formData.append("description", description);
      formData.append("acceptance_criteria", acceptanceCriteria);
      formData.append("storypoints", storypoints ? Number(storypoints) : "");
      formData.append("complexity", complexity ? Number(complexity) : "");
      formData.append("feature_id", selectedFeature ? Number(selectedFeature) : "");
      
      if (attachmentFlag === "Yes" && attachmentFiles.length > 0) {
        attachmentFiles.forEach(file => {
          formData.append("attachment", file);
        });
      }

      await api.post(`/tasks/${id}/clone`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Task cloned successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error cloning:", err);
      alert("Failed to clone task.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">

      {/* Project */}
      <div className="form-group">
        <label>Project<sup style={{color: "red"}}>*</sup></label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          required
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Feature */}
      <div className="form-group">
        <label>Feature<sup style={{color: "red"}}>*</sup></label>
        <select
          value={selectedFeature}
          onChange={(e) => setSelectedFeature(e.target.value)}
          required
        >
          <option value="">-- Select Feature --</option>
          {features.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task Type */}
      <div className="form-group">
        <label>Task Type<sup style={{color: "red"}}>*</sup></label>
        <select
          value={selectedTaskType}
          onChange={(e) => setSelectedTaskType(e.target.value)}
          required
        >
          <option value="">-- Select Task Type --</option>
          {taskTypes.map((tt) => (
            <option key={tt.id} value={tt.id}>
              {tt.description}
            </option>
          ))}
        </select>
      </div>

      {/* Task Status */}
      <div className="form-group">
        <label>Task Status<sup style={{color: "red"}}>*</sup></label>
        <select
          value={selectedTaskStatus}
          onChange={(e) => setSelectedTaskStatus(e.target.value)}
          required
        >
          <option value="">-- Select Task Status --</option>
          {taskStatuses.map((ts) => (
            <option key={ts.id} value={ts.id}>
              {ts.decription}
            </option>
          ))}
        </select>
      </div>

      {/* User Story */}
      <div className="form-group full-width">
        <label>User Story<sup style={{color: "red"}}>*</sup></label>
        <textarea
          value={userstory}
          onChange={(e) => setUserstory(e.target.value)}
          rows={1}
          maxLength={255}
          onDoubleClick={(e) => e.target.rows = e.target.rows === 1 ? 4 : 1}
          required
        />
      </div>

      {/* Description */}
      <div className="form-group half-width">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={1}
          maxLength={255}
          onDoubleClick={(e) => e.target.rows = e.target.rows === 1 ? 4 : 1}
        />
      </div>

      {/* Acceptance Criteria */}
      <div className="form-group half-width">
        <label>Acceptance Criteria</label>
        <textarea
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          rows={1}
          maxLength={255}
          onDoubleClick={(e) => e.target.rows = e.target.rows === 1 ? 4 : 1}
        />
      </div>

      {/* Complexity */}
      <div className="form-group">
        <label>Complexity<sup style={{color: "red"}}>*</sup></label>
        <input
          type="number"
          min="1"
          max="5"
          value={complexity}
          onChange={(e) => {
            let val = e.target.value;
            if (val === "") {
              setComplexity("");
              return;
            }
            let intVal = parseInt(val, 10);
            if (!isNaN(intVal)) {
              if (intVal < 1) intVal = 1;
              if (intVal > 5) intVal = 5;
              setComplexity(intVal);
            }
          }}
          required
        />
      </div>

      {/* Story Points */}
      <div className="form-group">
        <label>Story Points<sup style={{color: "red"}}>*</sup></label>
        <input
          type="number"
          min="0"
          value={storypoints}
          onChange={(e) => setStorypoints(e.target.value)}
        />
      </div>

      {/* Sprint */}
      <div className="form-group">
        <label>Sprint</label>
        <select
          value={selectedSprint}
          onChange={(e) => setSelectedSprint(e.target.value)}
        >
          <option value="">-- Select Sprint --</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="form-group">
        <label>Start Date</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>End Date</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* User */}
      <div className="form-group">
        <label>User</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">-- Select User --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name}
            </option>
          ))}
        </select>
      </div>

      {/* Reported To */}
      <div className="form-group">
        <label>Reported To</label>
        <select
          value={reportedTo}
          onChange={(e) => setReportedTo(e.target.value)}
        >
          <option value="">-- Select Manager --</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.preffered_name}
            </option>
          ))}
        </select>
      </div>

      {/* Attachment */}
      <div className="form-group">
        <label>Attachment Flag</label>
        <select
          value={attachmentFlag}
          onChange={(e) => setAttachmentFlag(e.target.value)}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>

      {attachmentFlag === "Yes" && existingAttachments.length > 0 && (
        <div className="form-group half-width" style={{ marginBottom: "10px" }}>
          <label>Existing Attachments</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {existingAttachments.map((att, index) => (
              <div key={index} className="attachment-file" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <span>📎 {att.attachmentName || att.attachment_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {attachmentFlag === "Yes" && (
        <div className={`form-group ${existingAttachments.length > 0 ? 'half-width' : 'full-width'} attachment-container`}>
          <label>{existingAttachments.length > 0 ? "Add Additional Attachments" : "Add Attachments"}</label>
          <input type="file" multiple onChange={(e) => {
            const files = Array.from(e.target.files);
            setAttachmentFiles(prev => [...prev, ...files]);
            e.target.value = null;
          }} />
          {attachmentFiles.length > 0 && (
            <div className="attachment-files-list">
              {attachmentFiles.map((file, index) => (
                <div key={index} className="attachment-file" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                  <span>📎 {file.name}</span>
                  <button type="button" className="remove-btn" onClick={() => setAttachmentFiles(prev => prev.filter((_, i) => i !== index))}>✖</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="btn-container full-width">
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button type="button" className="btn-global btn-success" onClick={handleClone}>Clone Task</button>
        <button type="submit" className="btn-global btn-primary">Update Task</button>
      </div>
    </form>
  );
}