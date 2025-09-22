import React, { useEffect, useState } from "react";
import api from "../api"; // your axios instance
import "./DailyTimeSheet.css";

export default function DailyTimesheet({ userId }) {
  const [entries, setEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    taskId: "",
    workTypeId: "",
    description: ""
  });

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's timesheet
  const fetchEntries = async () => {
    try {
      const res = await api.get(`/timesheets/day/${today}`,{withCredentials:true});
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  // Fetch tasks assigned to user
  const fetchTasks = async () => {
    try {
      const res = await api.get(`/user/active/tasks`,{withCredentials:true});
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  // Fetch work types
  const fetchWorkTypes = async () => {
    try {
      const res = await api.get("/worktypes",{withCredentials:true});
      setWorkTypes(res.data);
    } catch (err) {
      console.error("Error fetching work types:", err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchTasks();
    fetchWorkTypes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    if (!form.startTime || !form.endTime) {
      alert("Start and End times are required");
      return;
    }

    const payload = {
      date: today,
      start_time: form.startTime,
      end_time: form.endTime,
      task: form.taskId ? { id: Number(form.taskId) } : null,
      workType: form.workTypeId ? { id: Number(form.workTypeId) } : null,
      description: form.description,
      is_permission_granted: true
    };

    try {
      await api.post("/timesheets", payload,{withCredentials:true});
      setForm({
        startTime: "",
        endTime: "",
        taskId: "",
        workTypeId: "",
        description: ""
      });
      fetchEntries();
    } catch (err) {
      console.error("Error adding entry:", err);
      alert("Failed to add entry");
    }
  };

  return (
    <div className="timesheet-container">
      <h2>Daily Timesheet ({today})</h2>

      {/* Form */}
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
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.userstory}
            </option>
          ))}
        </select>
        <select name="workTypeId" value={form.workTypeId} onChange={handleChange}>
          <option value="">Select Work Type</option>
          {workTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <button onClick={handleAdd}>+ Add</button>
      </div>

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
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr
              key={idx}
              className={entry.isAutoMarkedLeave ? "auto-leave" : ""}
            >
              <td>{entry.start_time || "-"}</td>
              <td>{entry.end_time || "-"}</td>
              <td>{entry.task?.userstory || "-"}</td>
              <td>{entry.workType?.description || "-"}</td>
              <td>{entry.description}</td>
              <td>{entry.is_permission_granted ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
