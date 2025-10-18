import React, { useEffect } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import { useLocation, useNavigate } from "react-router-dom";

export default function TimesheetExcelExport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, startDate, endDate } = location.state || {};

  useEffect(() => {
    if (!userId || !startDate || !endDate) {
      alert("Missing user or date range");
      navigate(-1);
      return;
    }

    const fetchAndExport = async () => {
      try {
        // Fetch combined API
        const res = await api.get(
          `/timesheets/range-summary-with-logs/${userId}`,
          { params: { start: startDate, end: endDate }, withCredentials: true }
        );

        const flattened = flattenForExcel(res.data);
        exportToExcel(flattened);
        navigate(-1); // Go back after export
      } catch (err) {
        console.error("Error exporting Excel:", err);
        alert("Failed to export timesheet");
        navigate(-1);
      }
    };

    fetchAndExport();
  }, [userId, startDate, endDate, navigate]);

  return <div>Generating Excel file...</div>;
}

// Flatten summary + logs for Excel
function flattenForExcel(data) {
  const rows = [];

  data.forEach((day) => {
    const dayStr = day.date; // YYYY-MM-DD
    const status = day.status;
    const totalHours = day.totalHours;

    // If no logs, just push a single row
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
      // Main row for the day
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

      // Subrows for each log
      day.logs.forEach((log) => {
        const start = log.start_time || "-";
        const end = log.end_time || "-";
        const duration =
          log.start_time && log.end_time
            ? ((new Date(`1970-01-01T${end}`) - new Date(`1970-01-01T${start}`)) /
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
}

// Export using SheetJS
function exportToExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheet");
  XLSX.writeFile(wb, `Timesheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
