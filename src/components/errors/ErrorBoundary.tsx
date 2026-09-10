import React from 'react';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

type ErrorBoundaryVariant = 'app' | 'page';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * When this value changes (convention: the current pathname) a caught
   * error is cleared, so navigating away from a broken page recovers it.
   */
  resetKey?: string;
  /**
   * 'app'  — full-screen last resort (wraps the router in App.tsx)
   * 'page' — content-area only; sidebar/header stay interactive
   */
  variant?: ErrorBoundaryVariant;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort render guard. Class component is intentional — React still has
 * no hook equivalent for getDerivedStateFromError/componentDidCatch.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Wire a monitoring service (Sentry & co.) here — console for now.
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private readonly handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { variant = 'app', children } = this.props;
    const { error } = this.state;
    if (error === null) return children;

    const isFullPage = variant === 'app';
    return (
      <div
        className={
          isFullPage
            ? 'flex min-h-screen w-full items-center justify-center bg-surface p-6'
            : 'flex min-h-[60vh] w-full items-center justify-center p-6'
        }
      >
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
            <AlertTriangle size={26} strokeWidth={2.2} />
          </div>
          <h1 className="mt-4 text-lg font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            An unexpected error occurred while rendering this page. The issue has been logged.
          </p>
          {error.message ? (
            <p className="mt-3 break-words rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-left font-mono text-[11px] text-gray-400">
              {error.message}
            </p>
          ) : null}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              <RotateCcw size={14} />
              Try again
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200/80 hover:text-gray-800"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
