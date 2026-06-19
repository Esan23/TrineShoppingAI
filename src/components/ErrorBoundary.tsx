import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches render errors so a single broken view never blanks the whole app. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Trine error boundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl text-ink dark:text-white">
            Something went sideways.
          </h1>
          <p className="mt-3 text-muted dark:text-slate-400">
            That's on us, not you. Reloading usually clears it.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            className="surface-gradient mt-6 inline-flex h-12 items-center justify-center rounded-[10px] bg-[length:200%_200%] px-7 font-semibold text-white transition hover:bg-right"
          >
            Back to Trine
          </button>
        </div>
      </div>
    );
  }
}
