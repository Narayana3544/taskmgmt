import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import * as XLSX from "xlsx";
import { FaFileExcel, FaEye, FaDownload } from "react-icons/fa";
import "./AdminAllTimesheet.css";

export default function AdminAllTimesheets() {

  const navigate = useNavigate();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const pastWeek = new Date();
  pastWeek.setDate(today.getDate() - 7);
  const pastWeekStr = pastWeek.toISOString().split("T")[0];
  const [summaries, setSummaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  // ✅ Default dates
  const [start, setStart] = useState(pastWeekStr);
  const [end, setEnd] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  // Fetch users
  useEffect(() => {
    api.get("/users", { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);
  // Fetch summary
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
  // Fetch selected user's range
  const handleViewUser = (userId, username) => {
    navigate(`/admin/timesheet-details/${userId}?start=${start}&end=${end}&name=${encodeURIComponent(username || '')}`);
  };

  const downloadSummaryExcel = () => {
    if (summaries.length === 0) {
      alert("No data to download.");
      return;
    }
    const data = summaries.map(s => ({
      User: s.username,
      "Days Filled": s.daysFilled
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Admin Summary");
    XLSX.writeFile(workbook, `Admin_Timesheet_Summary_${start}_to_${end}.xlsx`);
  };
  // Excel Export
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
                    new Date(`1970-01-01T${start}`)) / 3600000
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
              ? log.permissionGranted ? "Yes" : "No"
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

  const formatHours = (entry) => {

    if (entry?.totalHoursAndMinutes) return entry.totalHoursAndMinutes;

    const th = entry?.totalHours;

    if (th === null || th === undefined || Number.isNaN(Number(th))) return "-";

    const totalMinutes = Math.round(Number(th) * 60);

    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = Math.abs(totalMinutes % 60);

    return `${hoursPart}h ${String(minutesPart).padStart(2, "0")}m`;

  };

  return (
    <div className="admin-all-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Admin Timesheet Overview</h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ margin: 0, fontWeight: 'bold' }}>Start:</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ margin: 0, fontWeight: 'bold' }}>End:</label>
            <input
              type="date"
              value={end}
              max={todayStr}
              onChange={(e) => setEnd(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button className="btn-global btn-primary" onClick={fetchSummary} style={{ padding: '6px 12px' }}>Search</button>
        </div>
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
                    onClick={() => handleViewUser(s.userId, s.username)}
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

    </div>

  );

}