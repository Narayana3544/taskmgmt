// import React, { useEffect } from "react";
// import api from "../api";
// import * as XLSX from "xlsx";
// import { useLocation, useNavigate } from "react-router-dom";

// export default function TimesheetExcelExport() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { userId, startDate, endDate } = location.state || {};

//   useEffect(() => {
//     if (!userId || !startDate || !endDate) {
//       alert("Missing user or date range");
//       navigate(-1);
//       return;
//     }

//     const fetchAndExport = async () => {
//       try {
//         // Fetch combined API
//         const res = await api.get(
//           `/timesheet/range-summary-with-logs/${userId}`,
//           { params: { start: startDate, end: endDate }, withCredentials: true }
//         );

//         const flattened = flattenForExcel(res.data);
//         exportToExcel(flattened);
//         navigate(-1); // Go back after export
//       } catch (err) {
//         console.error("Error exporting Excel:", err);
//         alert("Failed to export timesheet");
//         navigate(-1);
//       }
//     };

//     fetchAndExport();
//   }, [userId, startDate, endDate, navigate]);

//   return <div>Generating Excel file...</div>;
// }

// // Flatten summary + logs for Excel
// function flattenForExcel(data) {
//   const rows = [];

//   data.forEach((day) => {
//     const dayStr = day.date; // YYYY-MM-DD
//     const status = day.status;
//     const totalHours = day.totalHours;

//     // If no logs, just push a single row
//     if (!day.logs || day.logs.length === 0) {
//       rows.push({
//         Date: dayStr,
//         Status: status,
//         "Total Hours": totalHours,
//         Start: "-",
//         End: "-",
//         Duration: "-",
//         Task: "-",
//         Description: "-",
//         "Work Type": "-",
//         Permission: "-"
//       });
//     } else {
//       // Main row for the day
//       rows.push({
//         Date: dayStr,
//         Status: status,
//         "Total Hours": totalHours,
//         Start: "-",
//         End: "-",
//         Duration: "-",
//         Task: "-",
//         Description: "-",
//         "Work Type": "-",
//         Permission: "-"
//       });

//       // Subrows for each log
//       day.logs.forEach((log) => {
//         const start = log.start_time || "-";
//         const end = log.end_time || "-";
//         const duration =
//           log.start_time && log.end_time
//             ? ((new Date(`1970-01-01T${end}`) - new Date(`1970-01-01T${start}`)) /
//                 3600000
//               ).toFixed(2)
//             : "-";

//         rows.push({
//           Date: "",
//           Status: "",
//           "Total Hours": "",
//           Start: start,
//           End: end,
//           Duration: duration,
//           Task: log.task?.userstory || "-",
//           Description: log.description || "-",
//           "Work Type": log.workType?.description || "-",
//           Permission: ["Official", "Time Off"].includes(
//             log.workType?.description
//           )
//             ? log.permissionGranted
//               ? "Yes"
//               : "No"
//             : "-"
//         });
//       });
//     }
//   });

//   return rows;
// }

// // Export using SheetJS
// function exportToExcel(data) {
//   const ws = XLSX.utils.json_to_sheet(data);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Timesheet");
//   XLSX.writeFile(wb, `Timesheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
// }


// import React, { useEffect } from "react";
// import api from "../api";
// import * as XLSX from "xlsx";
// import { useLocation, useNavigate } from "react-router-dom";

// export default function TimesheetExcelExport() {
//   const location = useLocation();
//   const navigate = useNavigate();

//   // Fallback username if not provided
//   const { userId, userName = "User", startDate, endDate } = location.state || {};

//   useEffect(() => {
//     if (!userId || !startDate || !endDate) {
//       alert("Missing user or date range");
//       navigate(-1);
//       return;
//     }

//     const fetchAndExport = async () => {
//       try {
//         // Fetch combined API
//         const res = await api.get(
//           `/timesheet/range-summary-with-logs/${userId}`,
//           { params: { start: startDate, end: endDate }, withCredentials: true }
//         );

//         const flattened = flattenForExcel(res.data);
//         exportToExcel(flattened, userName, startDate, endDate);
//         navigate(-1); // Go back after export
//       } catch (err) {
//         console.error("Error exporting Excel:", err);
//         alert("Failed to export timesheet");
//         navigate(-1);
//       }
//     };

//     fetchAndExport();
//   }, [userId, userName, startDate, endDate, navigate]);

//   return <div>Generating Excel file...</div>;
// }

// // Flatten summary + logs for Excel
// function flattenForExcel(data) {
//   const rows = [];

//   data.forEach((day) => {
//     const dayStr = day.date;
//     const status = day.status;
//     const totalHours = day.totalHours;

//     if (!day.logs || day.logs.length === 0) {
//       rows.push({
//         Date: dayStr,
//         Status: status,
//         "Total Hours": totalHours,
//         Start: "-",
//         End: "-",
//         Duration: "-",
//         Task: "-",
//         Description: "-",
//         "Work Type": "-",
//         Permission: "-"
//       });
//     } else {
//       rows.push({
//         Date: dayStr,
//         Status: status,
//         "Total Hours": totalHours,
//         Start: "-",
//         End: "-",
//         Duration: "-",
//         Task: "-",
//         Description: "-",
//         "Work Type": "-",
//         Permission: "-"
//       });

//       day.logs.forEach((log) => {
//         const start = log.start_time || "-";
//         const end = log.end_time || "-";
//         const duration =
//           log.start_time && log.end_time
//             ? ((new Date(`1970-01-01T${end}`) - new Date(`1970-01-01T${start}`)) /
//                 3600000
//               ).toFixed(2)
//             : "-";

//         rows.push({
//           Date: "",
//           Status: "",
//           "Total Hours": "",
//           Start: start,
//           End: end,
//           Duration: duration,
//           Task: log.task?.userstory || "-",
//           Description: log.description || "-",
//           "Work Type": log.workType?.description || "-",
//           Permission: ["Official", "Time Off"].includes(
//             log.workType?.description
//           )
//             ? log.permissionGranted
//               ? "Yes"
//               : "No"
//             : "-"
//         });
//       });
//     }
//   });

//   return rows;
// }

// // Export using SheetJS with dynamic filename
// function exportToExcel(data, userName, startDate, endDate) {
//   const ws = XLSX.utils.json_to_sheet(data);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Timesheet");

//   const start = new Date(startDate).toISOString().slice(0, 10);
//   const end = new Date(endDate).toISOString().slice(0, 10);

//   const fileName = `Timesheet_${userName}_from_${start}_to_${end}.xlsx`;

//   XLSX.writeFile(wb, fileName);
// }


import React, { useEffect, useRef } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import { useLocation, useNavigate } from "react-router-dom";

export default function TimesheetExcelExport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, startDate, endDate } = location.state || {};
  const hasExported = useRef(false); // prevent multiple downloads

  useEffect(() => {
    if (hasExported.current) return; // skip if already exported
    hasExported.current = true;

    if (!userId || !startDate || !endDate) {
      alert("Missing user or date range");
      navigate(`/admin/timesheets`);
      return;
    }

    const fetchUserAndExport = async () => {
      try {
        // 1️⃣ Fetch user info to get username
        const userRes = await api.get(`/user/${userId}`, { withCredentials: true });
        const userName = userRes.data.username || "User";

        // 2️⃣ Fetch timesheet summary
        const res = await api.get(
          `/timesheet/range-summary-with-logs/${userId}`,
          { params: { start: startDate, end: endDate }, withCredentials: true }
        );

        const flattened = flattenForExcel(res.data);
        exportToExcel(flattened, userName, startDate, endDate);

        navigate(`/admin/timesheets`); // go back after export
      } catch (err) {
        console.error("Error exporting Excel:", err);
        alert("Failed to export timesheet");
        navigate(`/admin/timesheets`);
      }
    };

    fetchUserAndExport();
  }, [userId, startDate, endDate, navigate]);

  return <div>Generating Excel file...</div>;
}

// Flatten summary + logs for Excel
function flattenForExcel(data) {
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

// Export using SheetJS with dynamic header and bold formatting
function exportToExcel(data, userName, startDate, endDate) {
  const ws = XLSX.utils.json_to_sheet(data, { origin: 4 }); // start data from row 5

  // Add header rows at the top
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      [`Username: ${userName}`],
      [`Start Date: ${new Date(startDate).toISOString().slice(0, 10)}`],
      [`End Date: ${new Date(endDate).toISOString().slice(0, 10)}`],
      [] // empty row before table
    ],
    { origin: 0 }
  );

  // Bold header rows (rows 1-3)
  [0, 1, 2].forEach((rowIdx) => {
    const cellRef = XLSX.utils.encode_row(rowIdx);
    Object.keys(ws).forEach((key) => {
      if (key.startsWith(cellRef)) {
        if (!ws[key].s) ws[key].s = {};
        ws[key].s.font = { bold: true };
      }
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheet");

  const start = new Date(startDate).toISOString().slice(0, 10);
  const end = new Date(endDate).toISOString().slice(0, 10);

  const fileName = `Timesheet_${userName}_from_${start}_to_${end}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
