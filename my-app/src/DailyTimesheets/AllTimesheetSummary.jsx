import React, { useState, useEffect } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import { FaFileExcel } from "react-icons/fa";
import "./AllTimesheetSummary.css";

export default function TimesheetSummary() {
  const [summaries, setSummaries] = useState([]);
  const [start, setStart] = useState("2025-10-01");
  const [end, setEnd] = useState("2025-10-31");

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/timesheet/all-summary?start=${start}&end=${end}`);
      setSummaries(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const exportToExcel = async (userId, username) => {
    try {
      const res = await api.get(
        `/timesheet/range-summary-with-logs/${userId}`,
        { params: { start, end }, withCredentials: true }
      );

      const flattened = flattenForExcel(res.data);
      exportExcel(flattened, username, start, end);
    } catch (err) {
      console.error("Error exporting Excel:", err);
      alert("Failed to export timesheet.");
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
          Permission: "-"
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
          Permission: "-"
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
            Permission: ["Official", "Time Off"].includes(
              log.workType?.description
            )
              ? log.permissionGranted
                ? "Yes"
                : "No"
              : "-"
          });
        });
      }
    });
    return rows;
  };

  const exportExcel = (data, username, startDate, endDate) => {
    const ws = XLSX.utils.json_to_sheet(data, { origin: 4 });
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [`Username: ${username}`],
        [`Start Date: ${startDate}`],
        [`End Date: ${endDate}`],
        []
      ],
      { origin: 0 }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet");
    const fileName = `Timesheet_${username}_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="timesheet-summary">
      <h2>All Users Timesheet Summary</h2>

      <div className="date-range">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button onClick={fetchSummary}>Fetch</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>User</th>
            {/* <th>Total Hours</th> */}
            <th>Days Filled</th>
            {/* <th>Total Working Days</th>
            <th>Missing Days</th>
            <th>Avg Hours/Day</th> */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.userId}>
              <td>{s.username}</td>
              {/* <td>{s.totalHours.toFixed(2)}</td> */}
              <td>{s.daysFilled}</td>
              {/* <td>{s.totalWorkingDays}</td>
              <td>{s.missingDays}</td>
              <td>{s.avgHoursPerDay.toFixed(2)}</td> */}
              <td>
                <FaFileExcel
                  title="Download Excel"
                  className="excel-icon"
                  onClick={() => exportToExcel(s.userId, s.username)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
