import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "./DailyTimeSheet.css";

export default function EditAnyTimesheet() {
  const { userId, date: dateParam } = useParams();

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

  // --------- Normalize Date ----------
  const normalizeDate = (d) => {
    if (!d) return new Date().toISOString().split("T")[0];

    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) {
      return new Date().toISOString().split("T")[0];
    }

    return parsed.toISOString().split("T")[0];
  };

  const normalizedDate = normalizeDate(dateParam);

  // --------- Fetch Timesheet Entries ----------
  const fetchEntries = async () => {
    try {
      const res = await api.get(
        `/timesheets/day/${userId}/${normalizedDate}`,
        { withCredentials: true }
      );

      const sorted = res.data.sort((a, b) =>
        (a.start_time || "").localeCompare(b.start_time || "")
      );

      setEntries(sorted);
    } catch (err) {
      console.error("Error fetching entries:", err);
      setEntries([]);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/user/${userId}/tasks`, { withCredentials: true });
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
  }, [userId, normalizedDate]);

  useEffect(() => {
    if (workTypes.length > 0 && !form.workTypeId) {
      setForm(prev => ({ ...prev, workTypeId: workTypes[0].id.toString() }));
    }
  }, [workTypes]);

  // --------- Helpers ----------
  const checkOverlap = (newEntry, list, excludeId = null) => {
    return list.some((e) => {
      if (excludeId && e.id === excludeId) return false;
      return !(
        newEntry.end_time <= e.start_time ||
        newEntry.start_time >= e.end_time
      );
    });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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

  // --------------- Add Entry ---------------
  const handleAdd = async () => {
    if (!form.startTime || !form.endTime) {
      alert("Start & End time required");
      return;
    }

    const payload = {
      userId: Number(userId),
      date: normalizedDate,
      start_time: form.startTime,
      end_time: form.endTime,
      task: form.taskId ? { id: Number(form.taskId) } : null,
      workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
      description: form.description,
      permission_granted: form.isPermissionGranted
    };

    if (checkOverlap(payload, entries)) {
      alert("Overlapping times not allowed");
      return;
    }

    await api.post(`/timesheet/user/${userId}/date/${normalizedDate}`, payload, { withCredentials: true });
    resetForm();
    fetchEntries();
  };

  // --------------- Edit Entry ---------------
  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      startTime: entry.start_time,
      endTime: entry.end_time,
      taskId: entry.task?.id || "",
      workTypeId: entry.workType?.id || "",
      description: entry.description,
      isPermissionGranted: entry.permission_granted
    });
  };

  const handleUpdate = async () => {
    const payload = {
      userId: Number(userId),
      date: normalizedDate,
      start_time: form.startTime,
      end_time: form.endTime,
      task: form.taskId ? { id: Number(form.taskId) } : null,
      workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
      description: form.description,
      permission_granted: form.isPermissionGranted
    };

    if (checkOverlap(payload, entries, editingId)) {
      alert("Overlapping times not allowed");
      return;
    }

    await api.put(`/timesheets/${editingId}/${userId}`, payload, { withCredentials: true });
    resetForm();
    fetchEntries();
  };

  return (
    <div className="timesheet-container">
      <h2>
        Edit Timesheet for User #{userId} ({normalizedDate})
      </h2>

      <div className="timesheet-form">
        <input type="time" name="startTime" value={form.startTime} onChange={handleChange} />
        <input type="time" name="endTime" value={form.endTime} onChange={handleChange} />

        <select name="taskId" value={form.taskId} onChange={handleChange}>
          <option value="">Select Task</option>
          {tasks.map(t => (
            <option key={t.id} value={t.id}>{t.userstory}</option>
          ))}
        </select>

        <select name="workTypeId" value={form.workTypeId} onChange={handleChange}>
          {workTypes.map(w => (
            <option key={w.id} value={w.id}>{w.description}</option>
          ))}
        </select>

        {["Official", "Time Off"].includes(
          workTypes.find(wt => wt.id === Number(form.workTypeId))?.description
        ) && (
          <label>
            <input
              type="checkbox"
              checked={form.isPermissionGranted}
              onChange={(e) =>
                setForm({ ...form, isPermissionGranted: e.target.checked })
              }
            />
            Permission Granted
          </label>
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

      <table className="timesheet-table">
        <thead>
          <tr>
            <th>Start</th><th>End</th><th>Task</th>
            <th>Work Type</th><th>Description</th>
            <th>Permission</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id}>
              <td>{e.start_time || "-"}</td>
              <td>{e.end_time || "-"}</td>
              <td>{e.task?.userstory || "-"}</td>
              <td>{e.workType?.description || "-"}</td>
              <td>{e.description}</td>
              <td>
                {["Official", "Time Off"].includes(e.workType?.description)
                  ? e.permission_granted ? "Yes" : "No"
                  : "-"}
              </td>
              <td>
                <button onClick={() => handleEdit(e)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
