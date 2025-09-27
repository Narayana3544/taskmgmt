import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

  const today = new Date().toISOString().split("T")[0];
  const canEdit = date === today; 

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
      const res = await api.get(`/timesheets/day/${date}`, { withCredentials: true });
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
      const res = await api.get(`/user/active/tasks`, { withCredentials: true });
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
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
  }, [date]);

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
    if (!form.startTime || !form.endTime) {
      alert("Start and End times are required");
      return;
    }

    const payload = {
      date,
      start_time: form.startTime,
      end_time: form.endTime,
      task: form.taskId ? { id: Number(form.taskId) } : null,
      workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
      description: form.description,
      is_permission_granted: form.isPermissionGranted // true if checked, false if not
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
    setForm({
      startTime: entry.start_time,
      endTime: entry.end_time,
      taskId: entry.task?.id || "",
      workTypeId: entry.workType?.id || "",
      description: entry.description || "",
      isPermissionGranted: entry.is_permission_granted ?? false
    });
  };

  const handleUpdate = async () => {
    if (!form.startTime || !form.endTime) {
      alert("Start and End times are required");
      return;
    }

    const payload = {
      date,
      start_time: form.startTime,
      end_time: form.endTime,
      task: form.taskId ? { id: Number(form.taskId) } : null,
      workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
      description: form.description,
      is_permission_granted: form.isPermissionGranted
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
      <h2>Daily Timesheet ({date})</h2>

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

          {/* Permission Checkbox only for Official / Time Off */}
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

          {editingId ? (
            <>
              <button onClick={handleUpdate}>Update</button>
              <button onClick={resetForm}>Cancel</button>
            </>
          ) : (
            <button onClick={handleAdd}>+ Add</button>
          )}
        </div>
      )}

      {/* Table */}
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
              <td>{entry.task?.userstory || "-"}</td>
              <td>{entry.workType?.description || "-"}</td>
              <td>{entry.description}</td>
              <td>
                {["Official", "Time Off"].includes(entry.workType?.description)
                  ? entry.permission_granted
                    ? "Yes"
                    : "No"
                  : "-"}
              </td>
              {canEdit && (
                <td>
                  <button onClick={() => handleEdit(entry)}>Edit</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
