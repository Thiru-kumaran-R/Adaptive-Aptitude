// src/App.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

// Central QueryClient configured to frozen caching rules
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default stale time
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      retry: (failureCount, error) => {
        // Do NOT retry 4xx errors
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          typeof (error as { status: unknown }).status === 'number'
        ) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Do not auto-retry mutations
    },
  },
});

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Silence raw log to prevent console leak in production (ACC-16)
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Unhandled Application Exception:', error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-canvas, #090d16)',
            color: 'var(--text-primary, #f0f4f8)',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          role="alert"
        >
          <div
            style={{
              maxWidth: '480px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface, #111827)',
              padding: '32px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle, #1f293d)',
            }}
          >
            <h1 style={{ fontSize: '20px', marginBottom: '12px', color: '#f87171' }}>
              Application Recovery Notice
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
              An unexpected condition interrupted the learner application. Your progress and tokens remain secure.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign('/app/dashboard')}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
