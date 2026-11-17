import * as React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const match = window.location.pathname.match(/\/businesses\/([^/]+)/);
      const businessId = match ? match[1] : null;

      return (
        <div className="p-12 max-w-xl mx-auto text-center space-y-6">
          <AlertCircle size={48} className="mx-auto text-rose-500" />
          <h2 className="text-xl font-bold text-text-primary">Something went wrong</h2>
          <p className="text-sm text-rose-500 font-medium bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          {businessId && (
            <p className="text-xs font-mono text-text-muted">Business ID: {businessId}</p>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer"
            >
              Retry
            </button>
            <Link
              to="/businesses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} /> Back to businesses
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
