import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function EditDailyTimesheet() {
  const { id } = useParams(); // entry id
  const navigate = useNavigate();

  const [entry, setEntry] = useState(null);
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

  // Load timesheet entry, tasks and work types on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [entryRes, tasksRes, workTypesRes] = await Promise.all([
          api.get(`/timesheet/${id}`, { withCredentials: true }),
          api.get(`/user/active/tasks`, { withCredentials: true }),
          api.get(`/worktypes`, { withCredentials: true })
        ]);
        const entryData = entryRes.data;
        setEntry(entryData);
        setTasks(tasksRes.data);
        setWorkTypes(workTypesRes.data);

        setForm({
          startTime: entryData.start_time || "",
          endTime: entryData.end_time || "",
          taskId: entryData.task?.id?.toString() || "",
          workTypeId: entryData.workType?.id?.toString() || "",
          description: entryData.description || "",
          isPermissionGranted: entryData.permission_granted || false,
        });
      } catch (err) {
        alert("Failed to load data");
        navigate("/admin/timesheets");
      }
    }
    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!form.startTime || !form.endTime) {
      alert("Start and End times are required");
      return;
    }

    try {
      const payload = {
        date: entry?.date, // keep original date
        start_time: form.startTime,
        end_time: form.endTime,
        task: form.taskId ? { id: Number(form.taskId) } : null,
        workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
        description: form.description,
        permission_granted: form.isPermissionGranted,
      };
      await api.put(`/timesheet/${id}`, payload, { withCredentials: true });
      alert("Timesheet entry updated!");
      navigate(`/timesheets/day/${entry?.date}`); // navigate back to daily timesheet page
    } catch (err) {
      alert("Failed to save entry");
    }
  };

  if (!entry) return <p>Loading...</p>;

  return (
    <div className="timesheet-container">
      <h2>Edit Timesheet Entry ({entry.date})</h2>

      <label>
        Start Time:
        <input type="time" name="startTime" value={form.startTime} onChange={handleChange} />
      </label>

      <label>
        End Time:
        <input type="time" name="endTime" value={form.endTime} onChange={handleChange} />
      </label>

      <label>
        Task:
        <select name="taskId" value={form.taskId} onChange={handleChange}>
          <option value="">Select Task</option>
          {tasks.map(task => (
            <option key={task.id} value={task.id}>{task.userstory}</option>
          ))}
        </select>
      </label>

      <label>
        Work Type:
        <select name="workTypeId" value={form.workTypeId} onChange={handleChange}>
          <option value="">Select Work Type</option>
          {workTypes.map(type => (
            <option key={type.id} value={type.id}>{type.description}</option>
          ))}
        </select>
      </label>

      {["Official", "Time Off"].includes(
        workTypes.find(wt => wt.id === Number(form.workTypeId))?.description
      ) && (
        <div>
          <input
            type="checkbox"
            name="isPermissionGranted"
            checked={form.isPermissionGranted}
            onChange={handleChange}
            id="permissionGranted"
          />
          <label htmlFor="permissionGranted">Permission Granted</label>
        </div>
      )}

      <label>
        Description:
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <div className="btn-container full-width">
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button type="button" className="btn-global btn-primary" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}
