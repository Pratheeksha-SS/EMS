import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, dismissed: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  dismissError = () => {
    this.setState({ hasError: false, dismissed: true });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, dismissed: false });
    this.forceUpdate(); // Trigger re-render of children
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught:', {
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    // Optionally send to error reporting service
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && !this.state.dismissed) {
      const errorName = this.state.error?.name || 'UnknownError';
      const errorMsg = process.env.NODE_ENV === 'development' 
        ? (this.state.error?.message || 'Unknown error') 
        : 'An unexpected error occurred';

      return (
        <>
          <div style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '24px', 
            textAlign: 'left', 
            maxWidth: '450px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ color: '#dc2626', margin: 0, fontSize: '18px' }}>
                {errorName}
              </h3>
              <button
                onClick={this.dismissError}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            <p style={{ color: '#374151', marginBottom: '20px', lineHeight: 1.5 }}>
              {errorMsg}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={this.resetError}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Continue
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔄 Reload
              </button>
              <a
                href="/"
                style={{
                  padding: '8px 16px',
                  color: '#4361ee',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🏠 Home
              </a>
            </div>
          </div>
          {this.props.children}
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

