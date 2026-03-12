import React from "react";

/**
 * LoadingState — enterprise loading indicator.
 * Shows a pulsing skeleton or spinner inside a card.
 *
 * Props:
 *   message — optional loading text (default: "Loading...")
 *   rows    — number of skeleton rows (default: 3)
 *   compact — smaller version for inline use
 */
const LoadingState = ({ message = "Loading...", rows = 3, compact = false }) => {
  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0" }}>
        <div className="loading-spinner" />
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{message}</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <div className="loading-spinner" style={{ margin: "0 auto 16px" }} />
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 24 }}>{message}</p>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="skeleton-line"
            style={{
              height: 14,
              marginBottom: 10,
              borderRadius: 4,
              width: `${85 - i * 15}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
