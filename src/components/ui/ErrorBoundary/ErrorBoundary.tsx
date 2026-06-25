"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          padding: "1.5rem", background: "#fff", border: "1px solid #E5E7EB",
          color: "#6B7280", fontSize: "0.8rem", textAlign: "center",
        }}>
          <p style={{ margin: 0 }}>Something went wrong rendering this section.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              marginTop: "0.5rem", padding: "0.3rem 0.75rem", border: "1px solid #E5E7EB",
              background: "transparent", cursor: "pointer", fontSize: "0.75rem",
            }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
