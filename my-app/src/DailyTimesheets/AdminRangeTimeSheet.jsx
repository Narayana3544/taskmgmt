import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AdminRangeTimeSheet.css";
import { FaEye, FaDownload } from "react-icons/fa";

export default function AdminRangeTimeSheet() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState([]);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
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
    try {
      const res = await api.get(`/timesheets/range-summary/${selectedUser}`, {
        params: { start: startDate, end: endDate },
        withCredentials: true,
      });
      setEntries(res.data);
      setDailyDetails([]);
      setSelectedDate(null);
    } catch (err) {
      console.error("Error fetching range summary:", err);
      alert("Failed to fetch data.");
    }
    setLoading(false);
  };

  // View daily details
  const handleViewDay = async (date) => {
    setLoadingDaily(true);
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
      setSelectedDate(date);
    } catch (err) {
      console.error("Error fetching daily entries:", err);
      alert("Failed to fetch daily details.");
      setDailyDetails([]);
      setSelectedDate(null);
    }
    setLoadingDaily(false);
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
    // Prefer backend-provided formatted string if available
    if (entry?.totalHoursAndMinutes) return entry.totalHoursAndMinutes;

    // Fallback: compute from totalHours (decimal)
    const th = entry?.totalHours;

    if (th === null || th === undefined || Number.isNaN(Number(th))) return "-";

    // round to nearest minute to avoid weird fractions
    const totalMinutes = Math.round(Number(th) * 60);
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = Math.abs(totalMinutes % 60);

    return `${hoursPart}h ${String(minutesPart).padStart(2, "0")}m`;
  };
  return (
    <div className="admin-timesheet-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Admin Timesheets</h2>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ margin: 0, fontWeight: 'bold' }}>User:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ margin: 0, fontWeight: 'bold' }}>Start:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ margin: 0, fontWeight: 'bold' }}>End:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button className="btn-global btn-primary" onClick={fetchRange} style={{ padding: '6px 12px' }}>
            Fetch
          </button>

          <button
            className="icon-download-btn"
            title="Download Excel"
            style={{ padding: '6px 10px', marginLeft: '10px' }}
            onClick={() => {
              if (!selectedUser) {
                alert("Please select a user to export data.");
                return;
              }
              navigate("/timesheet-export", {
                state: { userId: selectedUser, startDate, endDate },
              });
            }}
          >
            <FaDownload />
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
                        margin: "0 auto"   // ✅ aligns inside table cell
                      }}
                      >
                       <FaEye/>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {selectedDate && (
        <div className="daily-details">
          <h3>Details for {selectedDate}</h3>
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
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                      {entry.task?.userstory || "-"}
                    </td>
                    <td>{entry.workType?.description || "-"}</td>
                    <td>{entry.description}</td>
                    <td>
                      {["Official", "Time Off"].includes(
                        entry.workType?.description
                      )
                        ? entry.permissionGranted
                          ? "Yes"
                          : "No"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No records for this day</p>
          )}
        </div>
      )}
    </div>
  );
}