/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  isFirestoreError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    isFirestoreError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    let parsedMsg = error.message || 'An unexpected application error occurred.';
    let isFirestoreError = false;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.operationType) {
        isFirestoreError = true;
        parsedMsg = `Cloud Sync Permission / Rule Notice (${parsed.operationType} on ${parsed.path || 'workspace'}): ${parsed.error}`;
      }
    } catch {
      // standard runtime error
    }
    return {
      hasError: true,
      errorMessage: parsedMsg,
      isFirestoreError,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WRKFLW SaaS Boundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
      isFirestoreError: false,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen tb-canvas flex items-center justify-center p-6">
          <div className="tb-surface max-w-lg w-full rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--tb-accent-soft)',
                  color: 'var(--tb-accent)',
                }}
              >
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-display font-bold">
                  {this.state.isFirestoreError
                    ? 'Cloud Database Access Guard Triggered'
                    : 'Workspace Recovery Notice'}
                </h2>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  {this.state.errorMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="tb-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                Return to Console
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
