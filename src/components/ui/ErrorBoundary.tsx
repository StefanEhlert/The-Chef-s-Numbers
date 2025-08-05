import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container-fluid p-4">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Ein Fehler ist aufgetreten!</h4>
            <p>
              Es tut uns leid, aber etwas ist schiefgelaufen. Bitte versuchen Sie, 
              die Seite neu zu laden oder kontaktieren Sie den Support.
            </p>
            <hr />
            <p className="mb-0">
              <button 
                className="btn btn-outline-danger"
                onClick={() => window.location.reload()}
              >
                Seite neu laden
              </button>
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3">
                <summary>Fehlerdetails (nur in Entwicklung)</summary>
                <pre className="mt-2 p-2 bg-light">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 