import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AdminRangeTimeSheet.css";
import { FaEye } from "react-icons/fa";
import "./AdminAllTimesheet.css";

export default function AdminRangeTimeSheet() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState([]);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const navigate = useNavigate();

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users", { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch range summary
  const fetchRange = async () => {
    if (!selectedUser || !startDate || !endDate) {
      alert("Please select user and both start and end dates.");
      return;
    }

    setLoading(true);
    setSelectedDate(null);
    setDailyDetails([]);
    try {
      const res = await api.get(`/timesheets/range-summary/${selectedUser}`, {
        params: { start: startDate, end: endDate },
        withCredentials: true,
      });
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching range summary:", err);
      alert("Failed to fetch data.");
    }
    setLoading(false);
  };

  // View daily details — switch to full detail view
  const handleViewDay = async (date) => {
    setLoadingDaily(true);
    setSelectedDate(date);
    try {
      const res = await api.get(`/timesheets/day/${selectedUser}/${date}`, {
        withCredentials: true,
      });
      const sortedDaily = res.data.sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return a.start_time.localeCompare(b.start_time);
      });
      setDailyDetails(sortedDaily);
    } catch (err) {
      console.error("Error fetching daily entries:", err);
      alert("Failed to fetch daily details.");
      setDailyDetails([]);
      setSelectedDate(null);
    }
    setLoadingDaily(false);
  };

  const handleBack = () => {
    setSelectedDate(null);
    setDailyDetails([]);
  };

  const isWeekend = (dateStr) => {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const isHoliday = (dateStr) => {
    const holidays = ["2025-09-21", "2025-10-02", "2025-10-03"];
    return holidays.includes(dateStr);
  };

  const formatHours = (entry) => {
    if (entry?.totalHoursAndMinutes) return entry.totalHoursAndMinutes;
    const th = entry?.totalHours;
    if (th === null || th === undefined || Number.isNaN(Number(th))) return "-";
    const totalMinutes = Math.round(Number(th) * 60);
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = Math.abs(totalMinutes % 60);
    return `${hoursPart}h ${String(minutesPart).padStart(2, "0")}m`;
  };

  // ── Daily detail view (matches AdminTimesheetDetails screenshot) ──
  if (selectedDate) {
    const displayName = selectedUserName || users.find(u => String(u.id) === String(selectedUser))?.first_name || `User #${selectedUser}`;
    return (
      <div className="admin-all-container">
        {/* Title */}
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h2>Timesheet Details for {displayName}</h2>
        </div>

        {/* Daily section */}
        <div className="daily-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, color: "#1e40af" }}>Logs for {selectedDate}</h3>
            <button
              className="btn-global btn-secondary"
              onClick={handleBack}
              style={{ background: "#222", color: "#fff", border: "none", padding: "7px 18px", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
            >
              Back
            </button>
          </div>

          {loadingDaily ? (
            <p>Loading...</p>
          ) : dailyDetails.length > 0 ? (
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
                {dailyDetails.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.start_time || "-"}</td>
                    <td>{entry.end_time || "-"}</td>
                    <td
                      className="task-cell"
                      style={{ maxWidth: "320px", whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "anywhere", textAlign: "left" }}
                    >
                      {entry.task
                        ? `Task: #${entry.task.id} - ${entry.task.userstory}`
                        : entry.bug
                        ? `Bug: #${entry.bug.id} - ${entry.bug.title}`
                        : "-"}
                    </td>
                    <td>{entry.workType?.description || "-"}</td>
                    <td className="description-cell">{entry.description || "-"}</td>
                    <td>
                      {["Official", "Time Off"].includes(entry.workType?.description)
                        ? entry.permissionGranted ? "Yes" : "No"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#666", textAlign: "center", marginTop: "20px" }}>No logs available for this date.</p>
          )}
        </div>
      </div>
    );
  }

  // ── Search / range view ──
  return (
    <div className="admin-timesheet-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Admin Timesheets</h2>

        {/* Filters Row */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <label style={{ margin: 0, fontWeight: "bold" }}>User:</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                const u = users.find(u => String(u.id) === e.target.value);
                setSelectedUserName(u?.first_name || "");
              }}
              style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <label style={{ margin: 0, fontWeight: "bold" }}>Start:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <label style={{ margin: 0, fontWeight: "bold" }}>End:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <button className="btn-global btn-primary" onClick={fetchRange} style={{ padding: "6px 12px" }}>
            Fetch
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="timesheet-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Hours</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((entry, idx) => {
                const weekend = isWeekend(entry.date);
                const holiday = isHoliday(entry.date);
                let rowClass = "";
                if (holiday) rowClass = "holiday-row";
                else if (weekend) rowClass = "weekend-row";
                else if (entry.status === "Leave") rowClass = "leave-row";

                return (
                  <tr key={idx} className={rowClass}>
                    <td>{entry.date}</td>
                    <td>{formatHours(entry)}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewDay(entry.date)}
                        style={{
                          border: "none",
                          background: "#e9f2ff",
                          color: "#007bff",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "17px",
                          transition: "0.2s",
                          margin: "0 auto",
                        }}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}