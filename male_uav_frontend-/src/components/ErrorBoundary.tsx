import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-red-950/20 border border-red-900 rounded p-6 m-6">
          <h2 className="text-xl font-bold text-red-500 mb-2">SYSTEM ERROR / DASHBOARD CRASH PROTECTED</h2>
          <p className="text-slate-300 text-sm mb-4">The dashboard encountered an unexpected error but recovered via ErrorBoundary.</p>
          <div className="bg-black/50 p-4 rounded text-red-400 font-mono text-xs w-full max-w-2xl overflow-auto border border-red-900/50">
            {this.state.error?.message}
          </div>
          <button 
            className="mt-6 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded text-sm transition-colors"
            onClick={() => this.setState({ hasError: false })}
          >
            ATTEMPT DASHBOARD RESTART
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
