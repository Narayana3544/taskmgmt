// File: TimesheetForm.jsx
import React, { useState } from "react";
import "./TimeSheetForm.css";

export default function TimesheetForm() {
  const [form, setForm] = useState({
    userId: "",
    managerId: "",
    weekStart: "",
    weekEnd: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess(null);
  }

  function validate() {
    if (!form.userId) return "Please enter userId";
    if (!form.managerId) return "Please enter managerId";
    if (!form.weekStart) return "Please select week start";
    if (!form.weekEnd) return "Please select week end";
    if (new Date(form.weekEnd) < new Date(form.weekStart)) return "weekEnd cannot be before weekStart";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const resp = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(form.userId),
          managerId: Number(form.managerId),
          weekStart: form.weekStart,
          weekEnd: form.weekEnd,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(errBody || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      setSuccess(data);
      setForm({ userId: "", managerId: "", weekStart: "", weekEnd: "" });
    } catch (err) {
      setError(err.message || "Failed to create timesheet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ts-card">
      <h2 className="ts-title">Create Weekly Timesheet</h2>

      <form className="ts-form" onSubmit={handleSubmit}>
        <label className="ts-label">
          Employee ID
          <input
            name="userId"
            value={form.userId}
            onChange={handleChange}
            className="ts-input"
            type="number"
            min="1"
            placeholder="Enter employee id"
          />
        </label>

        <label className="ts-label">
          Manager ID
          <input
            name="managerId"
            value={form.managerId}
            onChange={handleChange}
            className="ts-input"
            type="number"
            min="1"
            placeholder="Enter manager id"
          />
        </label>

        <label className="ts-label">
          Week Start
          <input
            name="weekStart"
            value={form.weekStart}
            onChange={handleChange}
            className="ts-input"
            type="date"
          />
        </label>

        <label className="ts-label">
          Week End
          <input
            name="weekEnd"
            value={form.weekEnd}
            onChange={handleChange}
            className="ts-input"
            type="date"
          />
        </label>

        {error && <div className="ts-error">{error}</div>}
        {success && (
          <div className="ts-success">
            Timesheet created (id: {success.id}) — week {success.weekStart} → {success.weekEnd}
          </div>
        )}

        <div className="ts-actions">
          <button className="ts-btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Timesheet"}
          </button>
        </div>
      </form>

      <small className="ts-note">Tip: pass valid userId and managerId. API base is <code>/api/timesheets</code></small>
    </div>
  );
}


