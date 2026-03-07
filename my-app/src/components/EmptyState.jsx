import React from "react";
import { Inbox } from "lucide-react";

/**
 * EmptyState — shown when a list/table has no data.
 *
 * Props:
 *   icon    — optional Lucide icon component
 *   title   — heading text (default: "No data")
 *   message — optional subtitle
 *   action  — optional JSX action (e.g. a "Create" button)
 */
const EmptyState = ({ icon: Icon = Inbox, title = "No data", message, action }) => {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "var(--color-bg-alt)", color: "var(--color-text-muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px"
      }}>
        <Icon size={24} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--color-text)" }}>
        {title}
      </h3>
      {message && (
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: action ? 20 : 0 }}>
          {message}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
