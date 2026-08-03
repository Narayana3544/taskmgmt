import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./Bugform.css";
import "../Task/TaskForm.css";
import { sortStatuses } from "../utils/sortUtils";

export default function BugForm() {
  const { id } = useParams(); // bugId for edit
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [initialData, setInitialData] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [featureName, setFeatureName] = useState("");
  const [sprintName, setSprintName] = useState("");
  const [taskId, setTaskId] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [reporterId, setReporterId] = useState("");

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [sprints, setSprints] = useState([]);
  const [sprintId, setSprintId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");

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
          api.get(`/view-bug/${id}`, { withCredentials: true })
        ]);

        const devs = devRes.data || [];
        const prios = priorityRes.data || [];
        const stats = statusRes.data || [];

        setDevelopers(devs);
        setPriorities(prios);
        setStatuses(sortStatuses(stats));

        // Populate form with existing bug data
        const bug = bugRes.data;

        // BugDTO returns strings for priority, status, assignee. Find their IDs:
        const matchedPriority = prios.find(p => (p.decription || p.description || p.name) === bug.priority);
        const matchedStatus = stats.find(s => (s.decription || s.description || s.name) === bug.status);
        const matchedUser = devs.find(d => (d.first_name || d.name || d.username) === (bug.assignee || bug.reporter || bug.assignedUser)); // Note: BugDTO has assignee

        const pId = matchedPriority?.id || bug.priority?.id || bug.priority || "";
        const sId = matchedStatus?.id || bug.status?.id || bug.status || "";
        const aId = matchedUser?.id || bug.assignedUser?.id || bug.assignedUser || bug.assignee || "";

        setTitle(bug.title || "");
        setDescription(bug.description || "");
        setPriority(pId);
        setStatus(sId);
        setAssignedTo(aId);
        setProjectName(bug.projectName || "");
        setFeatureName(bug.featureName || "");
        setSprintName(bug.sprintName || "");
        setTaskId(bug.taskId || null);
        setTaskTitle(bug.taskTitle || "");
        // Use the already fetched devs to find the reporter ID
        const matchedReporter = devs.find(d => (d.first_name || d.name || d.username) === bug.reporter);
        setReporterId(matchedReporter ? matchedReporter.id : "");

        // Load projects first
        const projRes = await api.get("/projects", { withCredentials: true });
        const allProjs = projRes.data || [];
        setProjects(allProjs);

        // Find matched project
        let projId = "";
        if (bug.projectName) {
          const matchedProj = allProjs.find(p => p.name === bug.projectName);
          projId = matchedProj ? matchedProj.id : "";
        }
        setSelectedProject(projId);

        // Fetch features if project is known
        let featId = "";
        if (projId) {
          const featRes = await api.get(`/features/project/${projId}`, { withCredentials: true });
          const allFeats = featRes.data || [];
          setFeatures(allFeats);
          if (bug.featureName) {
            const matchedFeat = allFeats.find(f => f.name === bug.featureName);
            featId = matchedFeat ? matchedFeat.id : "";
          }
          setSelectedFeature(featId);
        }

        // Fetch sprints if feature is known
        let spId = "";
        if (featId) {
          const sprintRes = await api.get(`/features/${featId}/sprints`, { withCredentials: true });
          const allSprints = sprintRes.data || [];
          setSprints(allSprints);
          if (bug.sprintName) {
            const matchedSprint = allSprints.find(s => s.name === bug.sprintName);
            spId = matchedSprint ? matchedSprint.id : "";
          }
          setSprintId(spId);
        }

        // Load tasks
        const tasksRes = await api.get("/view-tasks?size=10000", { withCredentials: true });
        const allTasks = tasksRes.data?.content || tasksRes.data || [];
        setTasks(allTasks);

        const bugTaskId = bug.taskId || "";
        setSelectedTaskId(bugTaskId);
        
        setInitialData({
          title: bug.title || "",
          description: bug.description || "",
          priority: pId || "",
          status: sId || "",
          assignedTo: aId || "",
          selectedProject: projId || "",
          selectedFeature: featId || "",
          sprintId: spId || "",
          selectedTaskId: bugTaskId || "",
          reporterId: matchedReporter ? matchedReporter.id : ""
        });

        if (bug.attachments && bug.attachments.length > 0) {
          setExistingAttachments(bug.attachments);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [id]);

  // Fetch features when project changes
  useEffect(() => {
    if (initialData && selectedProject) {
      api.get(`/features/project/${selectedProject}`, { withCredentials: true })
        .then(res => {
          const activeFeatures = res.data.filter(f => 
            f.status?.decription !== "Completed" && 
            f.status?.decription !== "DONE" &&
            f.status?.decription !== "Completed " ||
            (initialData.selectedFeature && f.id === parseInt(initialData.selectedFeature))
          );
          setFeatures(activeFeatures);
        })
        .catch(err => console.error(err));
    } else if (initialData && !selectedProject) {
      setFeatures([]);
    }
  }, [selectedProject, initialData]);

  // Fetch sprints when feature changes
  useEffect(() => {
    if (initialData && selectedFeature) {
      api.get(`/features/${selectedFeature}/sprints`, { withCredentials: true })
        .then(res => {
          setSprints(res.data || []);
        })
        .catch(err => console.error("Error fetching sprints:", err));
    } else if (initialData && !selectedFeature) {
      setSprints([]);
    }
  }, [selectedFeature, initialData]);

  // File handlers
  const MAX_FILE_SIZE_MB = 50;
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const oversized = selected.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    const valid = selected.filter(f => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      alert(`The following file(s) exceed the ${MAX_FILE_SIZE_MB}MB limit and were not added:\n${oversized.map(f => f.name).join("\n")}`);
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
      setUploadProgress({});
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingAttachment = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await api.delete(`/bugs/attachments/${attachmentId}`, { withCredentials: true });
      setExistingAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    } catch (err) {
      console.error("Error deleting attachment:", err);
      alert("Failed to delete attachment.");
    }
  };

  // Submit (Edit Bug)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return alert("Please fill all required fields (Title, Description).");
    }

    if (assignedTo && reporterId && String(assignedTo) === String(reporterId)) {
      return alert("Assign To and Reported To must be different users.");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("priorityId", priority);
    formData.append("statusId", status || 1); 
    formData.append("assignedToId", assignedTo);
    if (sprintId) {
      formData.append("sprintId", sprintId);
    }
    if (selectedTaskId) {
      formData.append("taskId", selectedTaskId);
    }
    if (reporterId) {
      formData.append("reporterId", reporterId);
    }

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

  const hasChanges = initialData && (
    title !== initialData.title ||
    description !== initialData.description ||
    String(priority) !== String(initialData.priority) ||
    String(status) !== String(initialData.status) ||
    String(assignedTo) !== String(initialData.assignedTo) ||
    String(selectedProject) !== String(initialData.selectedProject) ||
    String(selectedFeature) !== String(initialData.selectedFeature) ||
    String(sprintId) !== String(initialData.sprintId) ||
    String(selectedTaskId) !== String(initialData.selectedTaskId) ||
    String(reporterId) !== String(initialData.reporterId) ||
    files.length > 0
  );

  return (
    <div className="task-form-container">
      <form onSubmit={handleSubmit} className="task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>
      {/* Project · Feature · Sprint */}
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Project Name</label>
        <select 
          value={selectedProject} 
          disabled
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Feature Name<sup style={{color:'red'}}>*</sup></label>
        <select value={selectedFeature} onChange={(e) => { setSelectedFeature(e.target.value); setSprintId(""); setSelectedTaskId(""); }} required>
          <option value="">-- Select Feature --</option>
          {features.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
        </select>
      </div>
      <div className="form-group" style={{ gridColumn: 'span 4', marginBottom: 0 }}>
        <label>Sprint Name<sup style={{color:'red'}}>*</sup></label>
        <select value={sprintId} onChange={(e) => { setSprintId(e.target.value); setSelectedTaskId(""); }} required>
          <option value="">-- Select Sprint --</option>
          {sprints.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      </div>

      {/* Bug Title / Title */}
      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Title<sup style={{color:'red'}}>*</sup></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      {/* Status */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">-- Select Status --</option>
          {statuses.map((s) => (<option key={s.id} value={s.id}>{s.decription || s.description || s.name}</option>))}
        </select>
      </div>

      {/* Priority */}
      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">-- Select Priority --</option>
          {priorities.map((p) => (<option key={p.id} value={p.id}>{p.decription || p.description || p.name}</option>))}
        </select>
      </div>

      {/* Assigned To */}
      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Assign To<sup style={{color:'red'}}>*</sup></label>
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required>
          <option value="">-- Select Developer --</option>
          {developers.map((d) => (<option key={d.id} value={d.id} disabled={String(d.id) === String(reporterId)}>{d.first_name || d.name || d.username}</option>))}
        </select>
      </div>

      {/* Reported To*/}
      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Reported To </label>
        <select value={reporterId} onChange={(e) => setReporterId(e.target.value)}>
          <option value="">-- Select User --</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id} disabled={String(d.id) === String(assignedTo)}>
              {d.first_name || d.name || d.username}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Description<sup style={{color:'red'}}>*</sup></label>
        <textarea rows="3" style={{ padding: '8px' }} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="form-group full-width attachment-container" style={{ gridColumn: 'span 12', margin: 0 }}>
          {existingAttachments.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Existing Attachments:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {existingAttachments.map((att) => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <span>📎 {att.fileName || att.filename || att.attachmentName}</span>
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
          )}

          <label>{existingAttachments.length > 0 ? "Add Additional Attachments:" : "Attachments:"}</label>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={handleFileChange} style={{ padding: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              {files.length > 0 && (
                <ul className="file-list" style={{ marginTop: 0 }}>
                  {files.map((file, idx) => (
                    <li key={idx} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', padding: '2px 8px' }}>
                      <span style={{ fontSize: '13px' }}>
                        📎 {file.name} ({Math.round(file.size / 1024)} KB)
                        {uploadProgress[file.name] && (
                          <span className="progress" style={{ color: "var(--color-success)"}}> - {uploadProgress[file.name]}%</span>
                        )}
                      </span>
                      <button type="button" className="remove-btn" onClick={() => handleRemoveFile(idx)} style={{ width: '16px', height: '16px', fontSize: '10px' }}>❌</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      {/* Linked Task with Unlink button */}
      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Linked Task</label>
        {selectedTaskId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="text" readOnly value={`#${selectedTaskId} - ${tasks.find(t => t.id === parseInt(selectedTaskId))?.userstory || taskTitle}`} style={{ flex: 1, background: '#f5f5f5', cursor: 'not-allowed' }} />
            <button
              type="button"
              onClick={() => { if (window.confirm("Are you sure you want to remove this task?")) { setSelectedTaskId(""); setTaskTitle(""); } }}
              style={{
                border: "none",
                background: "#fee2e2",
                color: "#dc2626",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "15px",
                transition: "0.2s"
              }}
              title="Remove linked task"
              onMouseEnter={(e) => {
                e.target.style.background = "#dc2626";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#fee2e2";
                e.target.style.color = "#dc2626";
              }}
            >
              ❌
            </button>
            <button
              type="button"
              className="btn-global btn-primary"
              onClick={() => navigate(`/task/${selectedTaskId}`)}
              style={{ whiteSpace: 'nowrap' }}
            >
              View Task
            </button>
          </div>
        ) : (
          <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}>
            <option value="">-- Link to a Task (Optional) --</option>
            {tasks
              .filter(t => {
                if (selectedFeature && t.feature?.id !== parseInt(selectedFeature)) return false;
                if (selectedProject && t.feature?.project?.id !== parseInt(selectedProject)) return false;
                if (sprintId && t.sprint?.id !== parseInt(sprintId)) return false;
                return true;
              })
              .map(t => (
                <option key={t.id} value={t.id}>#{t.id} - {t.userstory || "Untitled Task"} ({t.taskStatus?.decription || t.taskStatus?.description || t.taskStatus?.name || "No Status"})</option>
              ))
            }
          </select>
        )}
      </div>

      <div className="btn-container full-width" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button type="submit" className="btn-global btn-primary" disabled={!hasChanges} style={{ opacity: !hasChanges ? 0.6 : 1, cursor: !hasChanges ? 'not-allowed' : 'pointer' }}>Update Bug</button>
      </div>
      </form>


    </div>
  );
}
