import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { sortAlphabetically, sortLatestFirst } from "../utils/sortUtils";
import { isTaskLocked, getLockedReason } from "../utils/lockUtils";
import { FaLock } from 'react-icons/fa';
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
  const [initialData, setInitialData] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedMsg, setLockedMsg] = useState("");

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

        setInitialData({
          userstory: t.userstory || "",
          description: t.description || "",
          acceptanceCriteria: t.acceptance_criteria || "",
          storypoints: t.storypoints || "",
          complexity: t.complexity || "",
          startDate: t.start_date ? t.start_date.slice(0, 16) : "",
          endDate: t.end_date ? t.end_date.slice(0, 16) : "",
          selectedTaskType: t.taskType?.id || "",
          selectedTaskStatus: t.taskStatus?.id || "",
          reportedTo: t.reportedTo?.id || "",
          selectedUser: t.user?.id || "",
          selectedFeature: t.feature?.id || "",
          selectedSprint: t.sprint?.id || "",
          selectedProject: t.feature?.project?.id || "",
          attachmentFlag: t.attachment_flag === "Yes" ? "Yes" : "No",
        });

        if (isTaskLocked(t)) {
          setIsLocked(true);
          setLockedMsg(getLockedReason(t));
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

  const handleDeleteExistingAttachment = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      if (attachmentId === 'legacy') {
        await api.delete(`/tasks/${id}/legacy-attachment`, { withCredentials: true });
      } else {
        await api.delete(`/tasks/attachments/${attachmentId}`, { withCredentials: true });
      }
      setExistingAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    } catch (err) {
      console.error("Error deleting attachment:", err);
      alert("Failed to delete attachment.");
    }
  };

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
    navigate(`/task?project=${selectedProject}&feature=${selectedFeature}`);
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

  const hasChanges = initialData && (
    userstory !== initialData.userstory ||
    description !== initialData.description ||
    acceptanceCriteria !== initialData.acceptanceCriteria ||
    String(storypoints) !== String(initialData.storypoints) ||
    String(complexity) !== String(initialData.complexity) ||
    startDate !== initialData.startDate ||
    endDate !== initialData.endDate ||
    String(selectedTaskType) !== String(initialData.selectedTaskType) ||
    String(selectedTaskStatus) !== String(initialData.selectedTaskStatus) ||
    String(reportedTo) !== String(initialData.reportedTo) ||
    String(selectedUser) !== String(initialData.selectedUser) ||
    String(selectedFeature) !== String(initialData.selectedFeature) ||
    String(selectedSprint) !== String(initialData.selectedSprint) ||
    String(selectedProject) !== String(initialData.selectedProject) ||
    attachmentFlag !== initialData.attachmentFlag ||
    attachmentFiles.length > 0
  );

  return (
    <div className="task-form-container">
      {isLocked && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaLock size={20} />
          <div>
            <strong>Task Locked:</strong>
            <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-line' }}>{lockedMsg}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px', opacity: isLocked ? 0.6 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>

      {/* Project */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
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
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
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
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
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
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
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
      <div className="form-group full-width" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>User Story<sup style={{color: "red"}}>*</sup></label>
        <textarea
          value={userstory}
          onChange={(e) => setUserstory(e.target.value)}
          rows={2} style={{ minHeight: '34px', padding: '8px' }}
          maxLength={255} onDoubleClick={(e) => e.target.rows = e.target.rows === 2 ? 4 : 2}
          required
        />
      </div>

      {/* Description */}
      <div className="form-group half-width" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2} style={{ minHeight: '34px', padding: '8px' }}
          maxLength={255} onDoubleClick={(e) => e.target.rows = e.target.rows === 2 ? 4 : 2}
        />
      </div>

      {/* Acceptance Criteria */}
      <div className="form-group half-width" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Acceptance Criteria</label>
        <textarea
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          rows={2} style={{ minHeight: '34px', padding: '8px' }}
          maxLength={255} onDoubleClick={(e) => e.target.rows = e.target.rows === 2 ? 4 : 2}
        />
      </div>

      {/* Complexity */}
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
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
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Story Points<sup style={{color: "red"}}>*</sup></label>
        <input
          type="number"
          min="0"
          value={storypoints}
          onChange={(e) => setStorypoints(e.target.value)}
        />
      </div>

      {/* Sprint */}
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
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

      {/* Dates + User + Reported To — all on ONE line */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Start Date</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>End Date</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
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

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
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

      {/* Attachment — all 3 side by side */}
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Attachment Flag</label>
        <select
          value={attachmentFlag}
          onChange={(e) => setAttachmentFlag(e.target.value)}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>

      {attachmentFlag === "Yes" && existingAttachments.length > 0 ? (
        <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
          <label>Existing Attachments</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {existingAttachments.map((att, index) => (
              <div key={index} className="attachment-file" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <span>📎 {att.attachmentName || att.attachment_name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteExistingAttachment(att.id)}
                  style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
                  title="Delete attachment"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ gridColumn: 'span 4' }} />
      )}

      {attachmentFlag === "Yes" ? (
        <div className="form-group attachment-container" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
          <label>{existingAttachments.length > 0 ? "Add Additional Attachments" : "Add Attachments"}</label>
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={(e) => {
            const files = Array.from(e.target.files);
            setAttachmentFiles(prev => [...prev, ...files]);
            e.target.value = null;
          }} style={{ padding: '4px' }} />
          {attachmentFiles.length > 0 && (
            <div className="attachment-files-list">
              {attachmentFiles.map((file, index) => (
                <div key={index} className="attachment-file" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '2px 6px' }}>
                  <span style={{ fontSize: '13px' }}>📎 {file.name}</span>
                  <button type="button" className="remove-btn" onClick={() => setAttachmentFiles(prev => prev.filter((_, i) => i !== index))} style={{ width: '16px', height: '16px', fontSize: '10px' }}>✖</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ gridColumn: 'span 8' }} />
      )}

      {/* Buttons */}
      <div className="btn-container full-width" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
        <button type="button" className="btn-global btn-secondary" onClick={handleClone}>
          Clone Task
        </button>
        <button type="submit" className="btn-global btn-primary" style={{ marginLeft: "10px", opacity: !hasChanges ? 0.6 : 1, cursor: !hasChanges ? 'not-allowed' : 'pointer' }} disabled={!hasChanges}>
          Update Task
        </button>
      </div>
    </form>
    </div>
  );
}