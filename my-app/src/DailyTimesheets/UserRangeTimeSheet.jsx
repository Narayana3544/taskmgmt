import React, { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "./UserRangeTimeSheet.css";
import { FaEye, FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function UserRangeTimeSheet() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  // ---- Daily drilldown state (same pattern as AdminTimesheetDetails) ----
  const [dailyDetails, setDailyDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  useEffect(() => {
    api.get("/user/profile", { withCredentials: true })
      .then(res => {
        setUserName(res.data?.first_name || res.data?.preferredName || res.data?.username || "Me");
      })
      .catch(() => setUserName("Me"));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Mock holidays — replace with API if available
  const holidays = ["2025-09-25", "2025-10-02"];

  const isWeekend = (dateStr) => {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (dateStr) => holidays.includes(dateStr);

  const fetchRange = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/timesheets/range-summary", {
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

  // ---- View button now drills into the day, same as Admin's handleViewDay ----
  const handleViewDay = async (date) => {
    setLoadingDaily(true);
    try {
      const res = await api.get(`/timesheets/day/${date}`, { withCredentials: true });
      const sorted = (res.data || []).sort((a, b) =>
        a.start_time?.localeCompare(b.start_time)
      );
      setDailyDetails(sorted);
      setSelectedDate(date);
    } catch (err) {
      console.error("Error fetching daily details:", err);
      alert("Failed to fetch logs for this date.");
      setDailyDetails([]);
      setSelectedDate(null);
    }
    setLoadingDaily(false);
  };

  const handleBack = () => {
    setSelectedDate(null);
    setDailyDetails([]);
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

  const downloadExcel = () => {
    if (selectedDate) {
      // Downloading the drilled-down day's logs
      if (dailyDetails.length === 0) {
        alert("No logs to download.");
        return;
      }
      const data = dailyDetails.map(d => ({
        Start: d.start_time || "-",
        End: d.end_time || "-",
        Task: d.task ? `Task #${d.task.id} - ${d.task.userstory}` : d.bug ? `Bug #${d.bug.id} - ${d.bug.title}` : "-",
        "Work Type": d.workType?.description || "-",
        Description: d.description || "-",
        Permission: ["Official", "Time Off"].includes(d.workType?.description) ? (d.permissionGranted ? "Yes" : "No") : "-"
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Logs_${selectedDate}`);
      XLSX.writeFile(workbook, `My_Logs_${selectedDate}.xlsx`);
      return;
    }

    // Downloading the full range summary
    if (entries.length === 0) {
      alert("No data to download.");
      return;
    }
    const data = entries.map(e => {
      const weekend = isWeekend(e.date);
      const holiday = isHoliday(e.date);
      let statusText = e.status || "-";
      if (holiday && e.totalHours === 0) statusText = "Holiday";
      else if (weekend && e.totalHours === 0) statusText = "Weekend";
      else if (e.status === "Leave") statusText = "Leave";
      else if (e.status === "Worked") statusText = "Worked";
      return {
        Date: e.date,
        "Total Hours": formatHours(e),
        Status: statusText
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "My Timesheets");
    XLSX.writeFile(workbook, `My_Timesheets_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="timesheet-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Timesheet Details for {userName}</h2>

        {!selectedDate && (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <label style={{ margin: 0, fontWeight: 'bold' }}>Start:</label>
                <input
                  type="date"
                  max={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <label style={{ margin: 0, fontWeight: 'bold' }}>End:</label>
                <input
                  type="date"
                  max={today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <button className="btn-global btn-primary" onClick={fetchRange} style={{ padding: '6px 12px' }}>Search</button>
              <button className="icon-download-btn" onClick={downloadExcel} title="Download Excel" style={{ padding: '6px 10px' }}>
                <FaDownload />
              </button>
            </>
          </div>
        )}
      </div>

      {!selectedDate ? (
        loading ? (
          <p>Loading...</p>
        ) : (
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const weekend = isWeekend(entry.date);
                const holiday = isHoliday(entry.date);

                let rowClass = "";
                let statusText = entry.status; // default from backend

                // Only override if no work done
                if (holiday && entry.totalHours === 0) {
                  rowClass = "holiday-row";
                  statusText = "Holiday";
                } else if (weekend && entry.totalHours === 0) {
                  rowClass = "weekend-row";
                  statusText = "Weekend";
                } else if (entry.status === "Leave") {
                  rowClass = "leave-row";
                  statusText = "Leave";
                } else if (entry.status === "Worked") {
                  rowClass = "worked-row"; // optional highlight for worked days
                  statusText = "Worked";
                }

                return (
                  <tr key={idx} className={rowClass}>
                    <td>{entry.date}</td>
                    <td>{formatHours(entry)}</td>
                    <td>{statusText}</td>
                    <td>
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => handleViewDay(entry.date)}>
                          <FaEye />
                        </button>
                        <span className="tooltip-text">View</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      ) : (
        <div className="daily-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '15px' }}>
            <h3 style={{ margin: 0, flex: 1, wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
              Logs for {selectedDate}
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-global btn-secondary"
                onClick={handleBack}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Back
              </button>
            </div>
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
                {dailyDetails.map((d, i) => (
                  <tr key={i}>
                    <td>{d.start_time || "-"}</td>
                    <td>{d.end_time || "-"}</td>
                    <td className="task-cell" style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                      {d.task ? `Task: #${d.task.id} - ${d.task.userstory}` : d.bug ? `Bug: #${d.bug.id} - ${d.bug.title}` : "-"}
                    </td>
                    <td>{d.workType?.description || "-"}</td>
                    <td className="description-cell">{d.description}</td>
                    <td>
                      {["Official", "Time Off"].includes(d.workType?.description)
                        ? d.permissionGranted ? "Yes" : "No"
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