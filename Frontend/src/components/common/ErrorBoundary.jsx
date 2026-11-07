import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Page rendering failed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" role="alert">
          <h2>Unable to display this page</h2>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
