import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering issue occurred.',
    };
  }

  handleRecover = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="mx-auto my-8 max-w-xl rounded-2xl border border-amber-300 bg-white p-8 text-slate-900 dark:border-amber-500/30 dark:bg-slate-900/80 dark:text-slate-100"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold">
                AgroHub View Recovery
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {this.state.errorMessage}
              </p>
              <button
                type="button"
                onClick={this.handleRecover}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
