import React, { useState, useEffect } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import { FaFileExcel, FaEye } from "react-icons/fa";
import "./AdminAllTimesheets.css";

export default function AdminAllTimesheets() {
  const [summaries, setSummaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [entries, setEntries] = useState([]);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [start, setStart] = useState("2025-10-01");
  const [end, setEnd] = useState("2025-10-31");
  const [loading, setLoading] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Fetch users
  useEffect(() => {
    api.get("/users", { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // Fetch all users' summary
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/timesheet/all-summary?start=${start}&end=${end}`);
      setSummaries(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
    setLoading(false);
  };

  // Fetch selected user’s range summary
  const fetchRange = async (userId) => {
    setSelectedUser(userId);
    setDailyDetails([]);
    setSelectedDate(null);
    setLoading(true);
    try {
      const res = await api.get(`/timesheets/range-summary/${userId}`, {
        params: { start, end },
        withCredentials: true,
      });
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching range summary:", err);
    }
    setLoading(false);
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

  // Fetch daily logs
  const handleViewDay = async (date) => {
    setLoadingDaily(true);
    try {
      const res = await api.get(`/timesheets/day/${selectedUser}/${date}`, {
        withCredentials: true,
      });
      const sorted = res.data.sort((a, b) =>
        a.start_time?.localeCompare(b.start_time)
      );
      setDailyDetails(sorted);
      setSelectedDate(date);
    } catch (err) {
      console.error("Error fetching daily details:", err);
      setDailyDetails([]);
      setSelectedDate(null);
    }
    setLoadingDaily(false);
  };

  // Excel export
  const exportToExcel = async (userId, username) => {
    try {
      const res = await api.get(`/timesheet/range-summary-with-logs/${userId}`, {
        params: { start, end },
        withCredentials: true,
      });
      const flat = flattenForExcel(res.data);
      exportExcel(flat, username, start, end);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const flattenForExcel = (data) => {
    const rows = [];
    data.forEach((day) => {
      const dayStr = day.date;
      const status = day.status;
      const totalHours = day.totalHours;

      if (!day.logs || day.logs.length === 0) {
        rows.push({
          Date: dayStr,
          Status: status,
          "Total Hours": totalHours,
          Start: "-",
          End: "-",
          Duration: "-",
          Task: "-",
          Description: "-",
          "Work Type": "-",
          Permission: "-",
        });
      } else {
        rows.push({
          Date: dayStr,
          Status: status,
          "Total Hours": totalHours,
          Start: "-",
          End: "-",
          Duration: "-",
          Task: "-",
          Description: "-",
          "Work Type": "-",
          Permission: "-",
        });

        day.logs.forEach((log) => {
          const start = log.start_time || "-";
          const end = log.end_time || "-";
          const duration =
            log.start_time && log.end_time
              ? (
                  (new Date(`1970-01-01T${end}`) -
                    new Date(`1970-01-01T${start}`)) /
                  3600000
                ).toFixed(2)
              : "-";

          rows.push({
            Date: "",
            Status: "",
            "Total Hours": "",
            Start: start,
            End: end,
            Duration: duration,
            Task: log.task?.userstory || "-",
            Description: log.description || "-",
            "Work Type": log.workType?.description || "-",
            Permission: ["Official", "Time Off"].includes(log.workType?.description)
              ? log.permissionGranted
                ? "Yes"
                : "No"
              : "-",
          });
        });
      }
    });
    return rows;
  };

  const exportExcel = (data, username, startDate, endDate) => {
    const ws = XLSX.utils.json_to_sheet(data, { origin: 4 });
    XLSX.utils.sheet_add_aoa(ws, [
      [`Username: ${username}`],
      [`Start Date: ${startDate}`],
      [`End Date: ${endDate}`],
      [],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet");
    XLSX.writeFile(wb, `Timesheet_${username}_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="admin-all-container">
      <h2>Admin Timesheet Overview</h2>

      <div className="filter-section">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button onClick={fetchSummary}>Fetch All</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="summary-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Days Filled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.userId}>
                <td>{s.username}</td>
                <td>{s.daysFilled}</td>
                <td className="actions-cell">
                  <FaEye
                    title="View Range Summary"
                    className="view-icon"
                    onClick={() => fetchRange(s.userId)}
                  />
                  <FaFileExcel
                    title="Export Excel"
                    className="excel-icon"
                    onClick={() => exportToExcel(s.userId, s.username)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedUser && entries.length > 0 && (
        <div className="range-section">
          <h3>Details for Selected User</h3>
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Hours</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={idx}>
                  <td>{e.date}</td>
                  <td>{formatHours(e)}</td>
                  <td>
                    <button onClick={() => handleViewDay(e.date)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDate && (
        <div className="daily-section">
          <h3>Logs for {selectedDate}</h3>
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
                {dailyDetails.map((d, i) => (
                  <tr key={i}>
                    <td>{d.start_time || "-"}</td>
                    <td>{d.end_time || "-"}</td>
                    <td>{d.task?.userstory || "-"}</td>
                    <td>{d.workType?.description || "-"}</td>
                    <td>{d.description}</td>
                    <td>
                      {["Official", "Time Off"].includes(d.workType?.description)
                        ? d.permissionGranted
                          ? "Yes"
                          : "No"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No logs available for this date.</p>
          )}
        </div>
      )}
    </div>
  );
}
