// src/pages/DashboardPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserGoals } from '../services/api/goalApi';
import {
  fetchNextAction,
  fetchDailyAgenda,
  issuePrescription,
  activatePrescription,
} from '../services/api/orchestrationApi';
import { fetchExamReadiness } from '../services/api/analyticsApi';
import { fetchWeakestPatterns } from '../services/api/progressApi';
import { NextActionCard } from '../components/dashboard/NextActionCard';
import { AgendaSegmentList } from '../components/dashboard/AgendaSegmentList';
import { ReadinessMeter } from '../components/dashboard/ReadinessMeter';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type {
  GoalDto,
  NextActionRecommendationDto,
  DailyAgendaContainerDto,
  ExamReadinessResponseDto,
  WeakestPatternsResponseDto,
  PublicActionDto,
} from '../types/api';
import styles from '../styles/pages.module.css';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [nextActionData, setNextActionData] = useState<NextActionRecommendationDto | null>(null);
  const [agendaData, setAgendaData] = useState<DailyAgendaContainerDto | null>(null);
  const [readinessData, setReadinessData] = useState<ExamReadinessResponseDto | null>(null);
  const [weakestPatterns, setWeakestPatterns] = useState<WeakestPatternsResponseDto | null>(null);

  const [isStartingNextAction, setIsStartingNextAction] = useState(false);
  const [startingAgendaActionId, setStartingAgendaActionId] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const goalsRes = await fetchUserGoals(user.userId);
      const userGoals = goalsRes.data || [];
      setGoals(userGoals);

      if (userGoals.length === 0) {
        setIsLoading(false);
        return;
      }

      const primaryGoalId = userGoals[0]?._id;

      const [nextRes, agendaRes, weakestRes] = await Promise.all([
        fetchNextAction({ userId: user.userId, goalId: primaryGoalId }).catch(() => null),
        fetchDailyAgenda({ userId: user.userId, goalId: primaryGoalId }).catch(() => null),
        fetchWeakestPatterns(user.userId, { limit: 5 }).catch(() => null),
      ]);

      if (nextRes) setNextActionData(nextRes.data);
      if (agendaRes) setAgendaData(agendaRes.data);
      if (weakestRes) setWeakestPatterns(weakestRes.data);

      if (primaryGoalId) {
        const readinessRes = await fetchExamReadiness(primaryGoalId, { userId: user.userId }).catch(() => null);
        if (readinessRes) setReadinessData(readinessRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.userId]);

  // Handle Next-Best-Action Start (Orchestration Sequence)
  const handleStartNextAction = async () => {
    if (!user?.userId || !nextActionData?.nextAction || isStartingNextAction) return;

    setIsStartingNextAction(true);
    setError(null);

    try {
      const primaryGoalId = goals[0]?._id;
      const idempotencyKey = crypto.randomUUID();

      // Op 64: Issue Prescription
      const issueRes = await issuePrescription(
        {
          originSurface: 'next_action',
          goalId: primaryGoalId,
        },
        idempotencyKey
      );

      const prescriptionId = issueRes.data.prescriptionId;

      // Op 56: Activate Lease
      await activatePrescription(prescriptionId);

      // Navigate to target activity
      const action = nextActionData.nextAction;
      if (action.actionType === 'adaptive_drill' || action.actionType === 'adaptive') {
        navigate(`/app/adaptive?prescriptionId=${prescriptionId}`);
      } else if (action.actionType === 'mock_examination' || action.actionType === 'mock') {
        navigate(`/app/mock-exams?prescriptionId=${prescriptionId}`);
      } else if (action.actionType === 'spaced_revision' || action.actionType === 'revision') {
        navigate(`/app/revision?prescriptionId=${prescriptionId}`);
      } else if (action.topic && action.pattern) {
        navigate(`/app/practice/${encodeURIComponent(action.topic)}/${encodeURIComponent(action.pattern)}?prescriptionId=${prescriptionId}`);
      } else if (action.topic) {
        navigate(`/app/practice/${encodeURIComponent(action.topic)}?prescriptionId=${prescriptionId}`);
      } else {
        navigate(`/app/practice?prescriptionId=${prescriptionId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initiate prescribed action.');
      setIsStartingNextAction(false);
    }
  };

  // Handle Agenda Segment Item Start (Orchestration Sequence)
  const handleStartAgendaActivity = async (activity: PublicActionDto) => {
    if (!user?.userId || !activity.actionId || startingAgendaActionId) return;

    setStartingAgendaActionId(activity.actionId);
    setError(null);

    try {
      const primaryGoalId = goals[0]?._id;
      const idempotencyKey = crypto.randomUUID();

      // Op 64: Issue Prescription (requires actionId for daily_agenda)
      const issueRes = await issuePrescription(
        {
          originSurface: 'daily_agenda',
          actionId: activity.actionId,
          goalId: primaryGoalId,
        },
        idempotencyKey
      );

      const prescriptionId = issueRes.data.prescriptionId;

      // Op 56: Activate Lease
      await activatePrescription(prescriptionId);

      // Navigate to target activity
      if (activity.actionType === 'adaptive_drill' || activity.actionType === 'adaptive') {
        navigate(`/app/adaptive?prescriptionId=${prescriptionId}`);
      } else if (activity.actionType === 'mock_examination' || activity.actionType === 'mock') {
        navigate(`/app/mock-exams?prescriptionId=${prescriptionId}`);
      } else if (activity.actionType === 'spaced_revision' || activity.actionType === 'revision') {
        navigate(`/app/revision?prescriptionId=${prescriptionId}`);
      } else if (activity.topic && activity.pattern) {
        navigate(`/app/practice/${encodeURIComponent(activity.topic)}/${encodeURIComponent(activity.pattern)}?prescriptionId=${prescriptionId}`);
      } else if (activity.topic) {
        navigate(`/app/practice/${encodeURIComponent(activity.topic)}?prescriptionId=${prescriptionId}`);
      } else {
        navigate(`/app/practice?prescriptionId=${prescriptionId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initiate agenda activity.');
      setStartingAgendaActionId(null);
    }
  };

  if (!isLoading && goals.length === 0) {
    return (
      <div className={styles.pageContainer} data-testid="dashboard-page">
        <h1 ref={headingRef} tabIndex={-1} className={styles.pageTitle} style={{ outline: 'none' }}>
          Learner Dashboard
        </h1>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No Study Goals Configured</h2>
          <p style={{ maxWidth: '400px', marginBottom: 'var(--space-6)' }}>
            To generate your individualized daily agenda and adaptive curriculum, set up your target exam goal first.
          </p>
          <Link
            to="/app/onboarding"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
            }}
          >
            Configure Target Goal Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer} data-testid="dashboard-page">
      <div className={styles.pageHeader}>
        <div>
          <h1 ref={headingRef} tabIndex={-1} className={styles.pageTitle} style={{ outline: 'none' }}>
            Learner Dashboard
          </h1>
          <p className={styles.pageSubtitle}>
            Welcome back, {user?.name || 'Learner'}. Active Goal: <strong>{goals[0]?.title}</strong>
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="180px" borderRadius="var(--radius-lg)" />
          <div className={styles.grid2Col}>
            <Skeleton height="320px" borderRadius="var(--radius-lg)" />
            <Skeleton height="320px" borderRadius="var(--radius-lg)" />
          </div>
        </div>
      ) : (
        <>
          {/* Hero Widget: Next-Best-Action */}
          <NextActionCard
            action={nextActionData?.nextAction}
            onStart={handleStartNextAction}
            isStarting={isStartingNextAction}
          />

          <div className={styles.grid2Col}>
            {/* Daily Agenda 4-segment sequence */}
            <div>
              <AgendaSegmentList
                segments={agendaData?.agenda?.segments}
                onSelectActivity={handleStartAgendaActivity}
                startingActionId={startingAgendaActionId}
              />
            </div>

            {/* Right sidebar: Readiness & Weakest Patterns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <ReadinessMeter
                  score={readinessData?.readinessScore}
                  status={readinessData?.readinessStatus}
                  reason={readinessData?.reason}
                />
              </div>

              {/* Weakest Patterns Widget */}
              {Array.isArray(weakestPatterns) && weakestPatterns.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                    Priority Focus Patterns
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {weakestPatterns.slice(0, 4).map((p) => (
                      <div
                        key={p.pattern}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 'var(--text-xs)',
                          padding: 'var(--space-2)',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{p.pattern}</span>
                        <span style={{ color: 'var(--status-error)', fontFamily: 'var(--font-mono)' }}>
                          {(p.accuracy * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
