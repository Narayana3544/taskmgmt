import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * ErrorState — enterprise error display with retry button.
 *
 * Props:
 *   message — error message to show
 *   onRetry — optional callback for retry button
 *   compact — smaller version for inline use
 */
const ErrorState = ({ message = "Something went wrong", onRetry, compact = false }) => {
  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "var(--color-danger)" }}>
        <AlertCircle size={14} />
        <span style={{ fontSize: 13 }}>{message}</span>
        {onRetry && (
          <button className="btn btn-sm btn-secondary" onClick={onRetry} style={{ marginLeft: 8 }}>
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "var(--color-danger-light)", color: "var(--color-danger)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px"
      }}>
        <AlertCircle size={24} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "var(--color-text)" }}>
        Error
      </h3>
      <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
