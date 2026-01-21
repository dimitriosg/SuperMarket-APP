import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const sentry = (window as Window & { Sentry?: { captureException: (err: Error) => void } })
      .Sentry;

    if (sentry?.captureException) {
      sentry.captureException(error);
      return;
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("React error boundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Κάτι πήγε στραβά
          </h1>
          <p className="max-w-xl text-sm text-gray-600">
            Παρουσιάστηκε ένα απρόσμενο σφάλμα. Δοκιμάστε ξανά ή ανανεώστε τη
            σελίδα αν το πρόβλημα συνεχίζεται.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Προσπαθήστε ξανά
          </button>
          {import.meta.env.DEV && this.state.error ? (
            <pre className="mt-4 w-full max-w-2xl overflow-auto rounded-md bg-gray-900 p-4 text-left text-xs text-gray-100">
              {this.state.error.message}
            </pre>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}
