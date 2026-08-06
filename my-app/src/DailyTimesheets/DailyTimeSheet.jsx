import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaEdit, FaEye } from "react-icons/fa";
import api from "../api"; 
import "./DailyTimeSheet.css";

export default function DailyTimesheet() {
  const { date } = useParams(); 
  const [entries, setEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    taskId: "",
    workTypeId: "",
    description: "",
    isPermissionGranted: false 
  });
  const [editingId, setEditingId] = useState(null);

  // ✅ Convert any incoming date to ISO (YYYY-MM-DD)
  const normalizeDate = (d) => {
    try {
      // If already in ISO (yyyy-mm-dd)
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      // If dd/mm/yyyy or mm/dd/yyyy
      const parsed = new Date(d);
      if (!isNaN(parsed)) {
        return parsed.toISOString().split("T")[0];
      }
    } catch (e) {
      console.warn("Invalid date format:", d);
    }
    // fallback to today
    return new Date().toISOString().split("T")[0];
  };

  const normalizedDate = normalizeDate(date);
  const today = new Date().toISOString().split("T")[0];
  const canEdit = normalizedDate === today; 

  const checkOverlap = (newEntry, entries, ignoreId = null) => {
    return entries.some(entry => {
      if (ignoreId && entry.id === ignoreId) return false;
      return !(
        newEntry.end_time <= entry.start_time || 
        newEntry.start_time >= entry.end_time
      );
    });
  };

  const fetchEntries = async () => {
    try {
      const res = await api.get(`/timesheets/day/${normalizedDate}`, { withCredentials: true });
      const sortedEntries = res.data.sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return a.start_time.localeCompare(b.start_time);
      });
      setEntries(sortedEntries);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const [tasksRes, bugsRes, profileRes] = await Promise.all([
        api.get(`/user/tasks`, { withCredentials: true }),
        api.get(`/user/bugs`, { withCredentials: true }),
        api.get(`/user/profile`, { withCredentials: true })
      ]);
      const userRole = profileRes.data?.role?.description || '';
      const loggedInUserId = profileRes.data?.id;

      const isAssignedToMe = (t) => {
        const assignedId = t.user?.id || t.assignedUser?.id;
        if (!loggedInUserId) return true; // fallback: show all if we can't determine user
        return assignedId === loggedInUserId;
      };

      const shouldShowTask = (t) => {
        // Only show tasks assigned to the logged-in user
        if (!isAssignedToMe(t)) return false;

        let statusStr = '';
        const statusObj = t.taskStatus || t.status;
        if (typeof statusObj === 'string') {
          statusStr = statusObj;
        } else if (statusObj) {
          statusStr = statusObj.decription || statusObj.description || statusObj.name || '';
        }
        statusStr = statusStr.trim().toLowerCase();

        const sprintStatus = (t.sprint?.status || '').toLowerCase();
        const isActiveSprint = sprintStatus === 'active';

        // "Done" status - only show if active sprint AND not Developer
        if (statusStr.includes('done') || statusStr.includes('completed') || statusStr.includes('closed') || statusStr.includes('resolved')) {
          if (!isActiveSprint) return false;
          if (userRole === 'Developer') return false;
          return true;
        }

        // All other statuses (To Do, In Progress, Fixed, Re-Open, Backlog) - always show
        return true;
      };

      const filteredTasks = (tasksRes.data || []).filter(shouldShowTask);
      const filteredBugs = (bugsRes.data || []).filter(shouldShowTask);

      const formattedTasks = filteredTasks.map(t => ({
        id: `task-${t.id}`,
        userstory: `Task: #${t.id} - ${t.userstory || "Untitled Task"}`
      }));
      
      const formattedBugs = filteredBugs.map(b => ({
        id: `bug-${b.id}`,
        userstory: `Bug: #${b.id} - ${b.title || "Untitled Bug"}`
      }));

      setTasks([...formattedTasks, ...formattedBugs]);
    } catch (err) {
      console.error("Error fetching tasks and bugs:", err);
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const res = await api.get("/worktypes", { withCredentials: true });
      setWorkTypes(res.data);
    } catch (err) {
      console.error("Error fetching work types:", err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchTasks();
    fetchWorkTypes();
  }, [normalizedDate]);

  // Default work type
  useEffect(() => {
    if (workTypes.length > 0 && !form.workTypeId) {
      setForm(prev => ({ ...prev, workTypeId: workTypes[0].id.toString() }));
    }
  }, [workTypes]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      startTime: "",
      endTime: "",
      taskId: "",
      workTypeId: "",
      description: "",
      isPermissionGranted: false
    });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!form.startTime || !form.endTime || !form.workTypeId ||!form.taskId) {
      alert("Start,End times,work_type and task are required");
      return;
    }

    const isTask = form.taskId && form.taskId.startsWith("task-");
    const isBug = form.taskId && form.taskId.startsWith("bug-");
    const dbId = form.taskId ? Number(form.taskId.split("-")[1]) : null;

    const payload = {
      date: normalizedDate,
      start_time: form.startTime,
      end_time: form.endTime,
      task: isTask ? { id: dbId } : null,
      bug: isBug ? { id: dbId } : null,
      workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
      description: form.description,
      permission_granted: form.isPermissionGranted
    };

    if (checkOverlap(payload, entries)) {
      alert("This time entry overlaps with an existing one.");
      return;
    }

    try {
      await api.post("/timesheets", payload, { withCredentials: true });
      resetForm();
      fetchEntries();
    } catch (err) {
      console.error("Error adding entry:", err);
      alert("Failed to add entry");
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    let selectedId = "";
    if (entry.task) {
      selectedId = `task-${entry.task.id}`;
    } else if (entry.bug) {
      selectedId = `bug-${entry.bug.id}`;
    }

    setForm({
      startTime: entry.start_time,
      endTime: entry.end_time,
      taskId: selectedId,
      workTypeId: entry.workType?.id || "",
      description: entry.description || "",
      isPermissionGranted: entry.permission_granted
    });
  };

  const handleUpdate = async () => {
    if (!form.startTime || !form.endTime) {
      alert("Start and End times are required");
      return;
    }

    const isTask = form.taskId && form.taskId.startsWith("task-");
    const isBug = form.taskId && form.taskId.startsWith("bug-");
    const dbId = form.taskId ? Number(form.taskId.split("-")[1]) : null;

    const payload = {
      date: normalizedDate,
      start_time: form.startTime,
      end_time: form.endTime,
      task: isTask ? { id: dbId } : null,
      bug: isBug ? { id: dbId } : null,
      workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
      description: form.description,
      permission_granted: form.isPermissionGranted
    };

    if (checkOverlap(payload, entries, editingId)) {
      alert("This time entry overlaps with an existing one.");
      return;
    }

    try {
      await api.put(`/timesheet/${editingId}`, payload, { withCredentials: true });
      resetForm();
      fetchEntries();
    } catch (err) {
      console.error("Error updating entry:", err);
      alert("Failed to update entry");
    }
  };

  return (
    <div className="timesheet-container">
      <h2>Daily Timesheet ({normalizedDate})</h2>

      {canEdit && (
        <div className="timesheet-form">
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
          />
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
          />
          <select name="taskId" value={form.taskId} onChange={handleChange}>
            <option value="">Select Task</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.userstory}
              </option>
            ))}
          </select>
          <select name="workTypeId" value={form.workTypeId} onChange={handleChange}>
            <option value="">Select Work Type</option>
            {workTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.description}
              </option>
            ))}
          </select>

          {/* Permission Checkbox */}
          {["Official", "Time Off"].includes(
            workTypes.find(wt => wt.id === Number(form.workTypeId))?.description
          ) && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPermissionGranted}
                onChange={(e) =>
                  setForm({ ...form, isPermissionGranted: e.target.checked })
                }
                id="permissionGranted"
              />
              <label htmlFor="permissionGranted">Permission Granted</label>
            </div>
          )}

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <div className="btn-container full-width" style={{ marginTop: '10px' }}>
            {editingId ? (
              <>
                <button onClick={resetForm} className="btn-global btn-secondary">Cancel</button>
                <button onClick={handleUpdate} className="btn-global btn-primary">Update</button>
              </>
            ) : (
              <button onClick={handleAdd} className="btn-global btn-primary">+ Add</button>
            )}
          </div>
        </div>
      )}

      <table className="timesheet-table">
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Task</th>
            <th>Work Type</th>
            <th>Description</th>
            <th>Permission</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className={entry.isAutoMarkedLeave ? "auto-leave" : ""}>
              <td>{entry.start_time || "-"}</td>
              <td>{entry.end_time || "-"}</td>
              <td className="task-cell" style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                {entry.task ? `Task: #${entry.task.id} - ${entry.task.userstory}` : entry.bug ? `Bug: #${entry.bug.id} - ${entry.bug.title}` : "-"}
              </td>
              <td>{entry.workType?.description || "-"}</td>
              <td className="description-cell" style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>{entry.description}</td>
              <td>
                {["Official", "Time Off"].includes(entry.workType?.description)
                  ? entry.permission_granted
                    ? "Yes"
                    : "No"
                  : "-"}
              </td>
              {canEdit && (
                <td>
                  <div className="action-buttons">
                    <div className="tooltip">
                      <FaEdit
                        className="icon-btn edit-icon"
                        onClick={() => handleEdit(entry)}
                      />
                      <span className="tooltip-text">Edit</span>
                    </div>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}