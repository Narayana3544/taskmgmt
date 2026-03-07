import React from "react";

/**
 * ErrorBoundary — catches JavaScript errors in its child tree
 * and renders a fallback UI instead of crashing the whole app.
 *
 * Usage (in App.jsx):
 *   <ErrorBoundary>
 *     <AppLayout> ... </AppLayout>
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production you'd send this to an error-tracking service
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#F9FAFB", fontFamily: "'Inter', sans-serif", padding: 32,
        }}>
          <div style={{
            maxWidth: 480, width: "100%", textAlign: "center",
            background: "white", borderRadius: 12, padding: "40px 32px",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
              An unexpected error occurred. This has been logged automatically.
              You can try reloading the page or returning to the dashboard.
            </p>

            {/* Error detail (dev only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre style={{
                textAlign: "left", background: "#FEE2E2", color: "#991B1B",
                padding: 12, borderRadius: 6, fontSize: 12, lineHeight: 1.5,
                maxHeight: 150, overflow: "auto", marginBottom: 24, whiteSpace: "pre-wrap",
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={this.handleGoHome}
                style={{
                  padding: "8px 20px", borderRadius: 6, border: "1px solid #E5E7EB",
                  background: "white", color: "#374151", fontWeight: 500, fontSize: 14, cursor: "pointer",
                }}>
                Go to Dashboard
              </button>
              <button onClick={this.handleReload}
                style={{
                  padding: "8px 20px", borderRadius: 6, border: "none",
                  background: "#2563EB", color: "white", fontWeight: 500, fontSize: 14, cursor: "pointer",
                }}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
