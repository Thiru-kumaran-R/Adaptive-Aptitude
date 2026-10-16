// src/router.tsx
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouteObject } from 'react-router-dom';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { Skeleton } from './components/common/Skeleton';

// Code-split pages for initial bundle budget (< 115 kB gzip)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DailyAgendaPage = lazy(() => import('./pages/DailyAgendaPage'));
const PracticeCatalogPage = lazy(() => import('./pages/PracticeCatalogPage'));
const TopicDetailPage = lazy(() => import('./pages/TopicDetailPage'));
const PatternPracticePage = lazy(() => import('./pages/PatternPracticePage'));
const AdaptivePracticePage = lazy(() => import('./pages/AdaptivePracticePage'));
const MistakesNotebookPage = lazy(() => import('./pages/MistakesNotebookPage'));
const RevisionQueuePage = lazy(() => import('./pages/RevisionQueuePage'));
const MockCatalogPage = lazy(() => import('./pages/MockCatalogPage'));
const MockSessionPage = lazy(() => import('./pages/MockSessionPage'));
const MockResultPage = lazy(() => import('./pages/MockResultPage'));
const MockReviewPage = lazy(() => import('./pages/MockReviewPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage'));
const TutorWorkspacePage = lazy(() => import('./pages/TutorWorkspacePage'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'));

const PageSuspenseFallback: React.FC = () => (
  <div
    style={{
      padding: 'var(--space-6)',
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
    }}
    role="status"
    aria-label="Loading page content"
  >
    <Skeleton height="40px" width="300px" borderRadius="var(--radius-md)" />
    <Skeleton height="150px" borderRadius="var(--radius-lg)" />
    <Skeleton height="250px" borderRadius="var(--radius-lg)" />
  </div>
);

export const RouteErrorBoundary: React.FC = () => {
  return (
    <div
      style={{
        padding: 'var(--space-8)',
        textAlign: 'center',
        maxWidth: '500px',
        margin: 'var(--space-12) auto',
      }}
      role="alert"
    >
      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>
        Unexpected Navigation Error
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
        The requested view encountered an unexpected condition. Please reload the application or return to your dashboard.
      </p>
      <a
        href="/app/dashboard"
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          backgroundColor: 'var(--accent-primary)',
          color: '#ffffff',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 'var(--text-sm)',
        }}
      >
        Return to Dashboard
      </a>
    </div>
  );
};

// Exactly 20 route path records (19 screens + 1 declarative redirect)
export const routes: RouteObject[] = [
  // 1. Landing
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <LandingPage />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  // 2. Login
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <LoginPage />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  // 3. Register
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <RegisterPage />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  // Protected Routes Wrapper
  {
    path: '/app',
    element: <ProtectedLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // 4. Declarative redirect to /app/dashboard
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      // 5. Onboarding
      {
        path: 'onboarding',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <OnboardingPage />
          </Suspense>
        ),
      },
      // 6. Dashboard
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      // 7. Agenda
      {
        path: 'agenda',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <DailyAgendaPage />
          </Suspense>
        ),
      },
      // 8. Practice Catalog
      {
        path: 'practice',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <PracticeCatalogPage />
          </Suspense>
        ),
      },
      // 9. Topic Detail
      {
        path: 'practice/:topic',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <TopicDetailPage />
          </Suspense>
        ),
      },
      // 10. Pattern Practice
      {
        path: 'practice/:topic/:pattern',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <PatternPracticePage />
          </Suspense>
        ),
      },
      // 11. Adaptive Practice
      {
        path: 'adaptive',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <AdaptivePracticePage />
          </Suspense>
        ),
      },
      // 12. Mistakes Notebook
      {
        path: 'mistakes',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <MistakesNotebookPage />
          </Suspense>
        ),
      },
      // 13. Revision Queue
      {
        path: 'revision',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <RevisionQueuePage />
          </Suspense>
        ),
      },
      // 14. Mock Catalog
      {
        path: 'mock-exams',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <MockCatalogPage />
          </Suspense>
        ),
      },
      // 15. Mock Session (Distraction-free)
      {
        path: 'mock-exams/:sessionId',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <MockSessionPage />
          </Suspense>
        ),
      },
      // 16. Mock Result
      {
        path: 'mock-exams/:sessionId/result',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <MockResultPage />
          </Suspense>
        ),
      },
      // 17. Mock Review
      {
        path: 'mock-exams/:sessionId/review',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <MockReviewPage />
          </Suspense>
        ),
      },
      // 18. Analytics Dashboard
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <AnalyticsDashboardPage />
          </Suspense>
        ),
      },
      // 19. Socratic AI Tutor Workspace
      {
        path: 'tutor',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <TutorWorkspacePage />
          </Suspense>
        ),
      },
      // 20. Learner Profile & Security Settings
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <ProfileSettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  // Catch-all 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export const router = createBrowserRouter(routes);
