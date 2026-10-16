// src/components/layout/ProtectedLayout.tsx
import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AuthBootstrapBoundary } from '../../context/AuthContext';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import styles from '../../styles/layout.module.css';

export class ProtectedShellBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Protected Shell Encountered an Error</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            Reload Shell
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ProtectedLayout: React.FC = () => {
  const location = useLocation();

  // Distraction-free active exam shell check (Record 15: /app/mock-exams/:id where not result/review)
  const isActiveMockExam =
    location.pathname.startsWith('/app/mock-exams/') &&
    !location.pathname.endsWith('/result') &&
    !location.pathname.endsWith('/review') &&
    location.pathname !== '/app/mock-exams' &&
    location.pathname !== '/app/mock-exams/';

  return (
    <ProtectedShellBoundary>
      <AuthBootstrapBoundary>
        {isActiveMockExam ? (
          // Distraction-free active exam layout
          <main style={{ minHeight: '100vh', width: '100%' }}>
            <Outlet />
          </main>
        ) : (
          // Standard learner shell
          <div className={styles.shell}>
            <AppSidebar />
            <div className={styles.mainWrapper}>
              <AppHeader />
              <main className={styles.contentArea}>
                <Outlet />
              </main>
              <BottomNav />
            </div>
          </div>
        )}
      </AuthBootstrapBoundary>
    </ProtectedShellBoundary>
  );
};
