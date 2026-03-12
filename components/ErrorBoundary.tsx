import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown runtime error',
    };
  }

  componentDidCatch(error: unknown) {
    console.error('UI crash caught by ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-amber-100 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-black/40 border border-amber-700/40 rounded-xl p-6 text-center">
            <h1 className="text-2xl font-bold text-amber-300 mb-2">The realm flickered... but you’re safe.</h1>
            <p className="text-sm text-amber-200/80 mb-3">The page hit an unexpected error. Please refresh and continue your adventure.</p>
            <p className="text-xs text-rose-300/80 mb-4 break-all">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-700 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Reload Adventure
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
