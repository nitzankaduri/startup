import { Component } from 'react';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';

/** Visible React Error Boundary preventing WebGL or runtime exceptions from collapsing into a black screen. */
export class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, componentStack: '' };
  }

  static getDerivedStateFromError(error) {
    return { error: error || new Error('Unknown 3D runtime error') };
  }

  componentDidCatch(error, info) {
    const stack = info?.componentStack || '';
    this.setState({ componentStack: stack });
    this.props.onError?.(error, stack);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, componentStack: '' });
    }
  }

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;
    if (this.props.inline) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#FAF9F6] dark:bg-[#0A0D14] text-[#181715] dark:text-[#F1F5F9]">
        <div className="w-full max-w-lg rounded-2xl bg-[#FFFFFF] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] p-6 shadow-[0_12px_40px_rgba(24,22,18,0.1)] flex flex-col gap-4">
          <div className="flex items-center gap-2.5 text-[#D96B27]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9]">
              3D Scene Runtime Error
            </h2>
          </div>

          <div className="rounded-xl bg-[#FAF9F6] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] p-3 text-xs font-mono text-[#9A3412] dark:text-[#FCA5A5] break-words">
            {error.message || String(error)}
          </div>

          {componentStack && (
            <pre className="max-h-36 overflow-auto rounded-xl bg-[#EFECE4]/70 dark:bg-[#182032] p-3 text-[11px] font-mono text-[#6E6A61] dark:text-[#94A3B8] whitespace-pre-wrap">
              {componentStack.trim()}
            </pre>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            {this.props.onBackToLobby && (
              <button
                type="button"
                onClick={this.props.onBackToLobby}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#182032] text-xs font-medium text-[#181715] dark:text-[#F1F5F9] hover:opacity-85"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Lobby</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { this.props.onRetry?.(); this.setState({ error: null, componentStack: '' }); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-semibold hover:opacity-90"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Scene</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
