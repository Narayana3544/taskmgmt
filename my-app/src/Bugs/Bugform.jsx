import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import api from "../api";
import { sortLatestFirst } from "../utils/sortUtils";
import "../Task/TaskForm.css"; // Reuse Task Form styles

export default function BugForm() {
  const { id } = useParams(); // taskId (optional)
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Specific Task we are creating a bug for
  const [selectedTaskId, setSelectedTaskId] = useState(id || "");
  const [taskObj, setTaskObj] = useState(null);

  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedFilterSprint, setSelectedFilterSprint] = useState("");

  // Selections
  const [sprintId, setSprintId] = useState("");
  const [storypoints, setStorypoints] = useState("");
  const [complexity, setComplexity] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [reportedTo, setReportedTo] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // Dropdown lists
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, usersRes, priorityRes, statusRes, projectsRes] = await Promise.all([
          api.get("/view-tasks?size=10000", { withCredentials: true }), // Fetch all tasks
          api.get("/users", { withCredentials: true }),
          api.get("/Priorities", { withCredentials: true }),
          api.get("/getstatusForTask", { withCredentials: true }),
          api.get("/projects", { withCredentials: true })
        ]);
        
        let allTasks = tasksRes.data?.content || tasksRes.data || [];
        if (!Array.isArray(allTasks)) {
          allTasks = [];
        }
        setTasks(allTasks);

        setDevelopers(usersRes.data || []);
        setPriorities(priorityRes.data || []);
        setStatuses(statusRes.data || []);
        setProjects(sortLatestFirst(projectsRes.data || []));

        // If ID was in URL, find that specific task
        if (id) {
          const found = allTasks.find(t => t.id === parseInt(id));
          setTaskObj(found || null);
        }

      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };
    
    fetchData();
  }, [id]);

  // Handle task selection when user manually picks a task from the dropdown
  useEffect(() => {
    if (!id && selectedTaskId) {
      const found = tasks.find(t => t.id === parseInt(selectedTaskId));
      setTaskObj(found || null);
    } else if (!id && !selectedTaskId) {
      setTaskObj(null);
    }
  }, [selectedTaskId, tasks, id]);

  // Fetch features when project changes
  useEffect(() => {
    if (selectedProject) {
      api.get(`/features/project/${selectedProject}`, { withCredentials: true })
        .then(res => {
          const activeFeatures = res.data.filter(f => 
            f.status?.decription !== "Completed" && 
            f.status?.decription !== "DONE" &&
            f.status?.decription !== "Completed "
          );
          setFeatures(sortLatestFirst(activeFeatures));
        })
        .catch(err => console.error(err));
    } else {
      setFeatures([]);
      setSelectedFeature("");
    }
  }, [selectedProject]);

  // Reset selected task if feature or sprint changes
  useEffect(() => {
    if (!id) {
       setSelectedTaskId("");
       setTaskObj(null);
    }
  }, [selectedFeature, selectedFilterSprint, id]);

  // Fetch active sprints based on project and feature
  useEffect(() => {
    const projId = id && taskObj ? taskObj.feature?.project?.id : selectedProject;
    if (projId) {
      api.get(`/project/activeSprints/${projId}`, { withCredentials: true })
        .then(res => {
          let activeSprints = res.data || [];
          const featId = id && taskObj ? taskObj.feature?.id : selectedFeature;
          if (featId) {
             activeSprints = activeSprints.filter(s => s.feature?.id === parseInt(featId));
          }
          setSprints(sortLatestFirst(activeSprints));
        })
        .catch(err => console.error("Error fetching sprints:", err));
    } else {
      setSprints([]);
      setSelectedFilterSprint("");
    }
  }, [selectedProject, selectedFeature, taskObj, id]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    setUploadProgress({});
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalTaskId = id || selectedTaskId;

    if (!finalTaskId) {
      return alert("Please select a Task.");
    }

    if (!title.trim() || !description.trim() || !priority || !assignedTo) {
      return alert("Please fill all required fields (Title, Description, Priority, Assigned To).");
    }

    const formData = new FormData();
    formData.append("taskId", finalTaskId);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("priorityId", priority);
    formData.append("statusId", status || 1);
    formData.append("assignedToId", assignedTo);
    
    if (sprintId) formData.append("sprintId", sprintId);
    if (storypoints) formData.append("storypoints", storypoints);
    if (complexity) formData.append("complexity", complexity);
    if (targetDate) formData.append("targetDate", targetDate);
    
    files.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      await api.post("/bugs", formData, {
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

      alert("Bug created successfully!");
      navigate(id ? `/task/${id}` : `/bugs`);
    } catch (err) {
      console.error("Error creating bug:", err);
      alert("Failed to create bug.");
    }
  };

  // Filter tasks to only show "In Progress" or "Done" tasks in the dropdown
  const filteredTasks = tasks.filter(t => {
    const statusDesc = t.taskStatus?.decription?.toLowerCase() || t.taskStatus?.description?.toLowerCase() || "";
    const isRightStatus = statusDesc.includes("progress") || statusDesc.includes("done");
    if (!isRightStatus) return false;

    if (selectedFeature && t.feature?.id !== parseInt(selectedFeature)) {
      return false;
    }
    
    // Also filter by selected project in case feature isn't selected but project is
    if (selectedProject && t.feature?.project?.id !== parseInt(selectedProject)) {
      return false;
    }
    
    if (selectedFilterSprint && t.sprint?.id !== parseInt(selectedFilterSprint)) {
      return false;
    }
    return true;
  });

  const taskOptions = filteredTasks.map(t => ({
    value: t.id,
    label: `#${t.id} - ${t.userstory || "Untitled Task"}`
  }));

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ padding: '15px', gap: '8px 15px', margin: '5px auto' }}>
      {/* Top Row: Task, Project, Feature */}
      {!id ? (
        <>
          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label>Project</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label>Feature</label>
            <select value={selectedFeature} onChange={(e) => setSelectedFeature(e.target.value)} disabled={!selectedProject}>
              <option value="">-- Select Feature --</option>
              {features.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label>Sprint (Filter Tasks)</label>
            <select value={selectedFilterSprint} onChange={(e) => setSelectedFilterSprint(e.target.value)} disabled={!selectedFeature}>
              <option value="">-- All Sprints --</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 1', zIndex: 100 }}>
            <label>Select Task (In Progress / Done) <sup style={{color: "red"}}>*</sup></label>
            <Select
              options={taskOptions}
              value={taskOptions.find(opt => opt.value === parseInt(selectedTaskId)) || null}
              onChange={(selected) => setSelectedTaskId(selected ? selected.value : "")}
              isClearable
              placeholder="Search for a task..."
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '34px',
                  borderRadius: 'var(--border-radius-sm, 4px)',
                  borderColor: 'var(--border-color, #ccc)'
                }),
                valueContainer: (base) => ({ ...base, padding: '0 8px' })
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Task</label>
            <input type="text" value={`#${taskObj?.id} - ${taskObj?.userstory || "Untitled Task"}`} disabled />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label>Project</label>
            <input type="text" value={taskObj?.feature?.project?.name || ""} disabled />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label>Feature</label>
            <input type="text" value={taskObj?.feature?.name || ""} disabled />
          </div>
        </>
      )}

      {/* Bug Title and Description on the same row */}
      <div className="form-group half-width">
        <label>Bug Title <sup style={{color: "red"}}>*</sup></label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group half-width">
        <label>Description <sup style={{color: "red"}}>*</sup></label>
        <textarea
          rows="1"
          style={{ minHeight: '34px', padding: '8px' }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Category / Assignments Row (4 columns) */}
      <div className="form-group">
        <label>Priority <sup style={{color: "red"}}>*</sup></label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
          <option value="">-- Select Priority --</option>
          {priorities.map((p) => (
            <option key={p.id} value={p.id}>
              {p.decription || p.description || p.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">-- Select Status --</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.decription || s.description || s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Assign To (Developer) <sup style={{color: "red"}}>*</sup></label>
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required>
          <option value="">-- Select Developer --</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.first_name || d.name || d.username}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Reported To (Optional)</label>
        <select value={reportedTo} onChange={(e) => setReportedTo(e.target.value)}>
          <option value="">-- Select User --</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.first_name || d.name || d.username}
            </option>
          ))}
        </select>
      </div>

      {/* Estimates / Dates Row (4 columns) */}
      <div className="form-group">
        <label>Sprint</label>
        <select value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
          <option value="">-- Select Sprint --</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Story Points</label>
        <input
          type="number"
          min="0"
          value={storypoints}
          onChange={(e) => setStorypoints(e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Complexity</label>
        <input
          type="number"
          min="0"
          max="5"
          placeholder="(1 to 5)"
          value={complexity}
          onChange={(e) => setComplexity(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Target Date</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      {/* File Attachments */}
      <div className="form-group full-width attachment-container" style={{ margin: 0 }}>
        <label>Attachments</label>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input type="file" multiple onChange={handleFileChange} style={{ padding: '4px' }} />
          </div>
          <div style={{ flex: 1 }}>
            {files.length > 0 && (
              <div className="attachment-files-list" style={{ marginTop: 0 }}>
                {files.map((file, index) => (
                  <div key={index} className="attachment-file" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', padding: '2px 8px' }}>
                    <span style={{ fontSize: '13px' }}>📎 {file.name}</span>
                    {uploadProgress[file.name] && <span style={{ color: "var(--color-success)"}}>{uploadProgress[file.name]}%</span>}
                    <button type="button" className="remove-btn" onClick={() => handleRemoveFile(index)} style={{ width: '16px', height: '16px', fontSize: '10px' }}>✖</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="btn-container full-width" style={{ marginTop: '5px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button type="submit" className="btn-global btn-primary">Report Bug</button>
      </div>
    </form>
  );
}