// src/pages/DailyAgendaPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchDailyAgenda,
  issuePrescription,
  activatePrescription,
} from '../services/api/orchestrationApi';
import { AgendaSegmentList } from '../components/dashboard/AgendaSegmentList';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type { DailyAgendaContainerDto, PublicActionDto } from '../types/api';
import styles from '../styles/pages.module.css';

export const DailyAgendaPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agendaData, setAgendaData] = useState<DailyAgendaContainerDto | null>(null);
  const [startingActionId, setStartingActionId] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const loadAgenda = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchDailyAgenda({ userId: user.userId });
      setAgendaData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily agenda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgenda();
  }, [user?.userId]);

  const handleStartActivity = async (activity: PublicActionDto) => {
    if (!user?.userId || !activity.actionId || startingActionId) return;

    setStartingActionId(activity.actionId);
    setError(null);

    try {
      const idempotencyKey = crypto.randomUUID();

      // Op 64: Issue Prescription
      const issueRes = await issuePrescription(
        {
          originSurface: 'daily_agenda',
          actionId: activity.actionId,
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
        navigate(
          `/app/practice/${encodeURIComponent(activity.topic)}/${encodeURIComponent(activity.pattern)}?prescriptionId=${prescriptionId}`
        );
      } else if (activity.topic) {
        navigate(`/app/practice/${encodeURIComponent(activity.topic)}?prescriptionId=${prescriptionId}`);
      } else {
        navigate(`/app/practice?prescriptionId=${prescriptionId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initiate agenda activity.');
      setStartingActionId(null);
    }
  };

  const segments = agendaData?.agenda?.segments;
  const isCompleted = segments && segments.every((s) => !s.activities || s.activities.length === 0);

  return (
    <div className={styles.pageContainer} data-testid="daily-agenda-page">
      <div className={styles.pageHeader}>
        <div>
          <h1 ref={headingRef} tabIndex={-1} className={styles.pageTitle} style={{ outline: 'none' }}>
            Prescriptive Daily Agenda
          </h1>
          <p className={styles.pageSubtitle}>
            Four structured segments balancing cognitive warmup, prerequisite resolution, core training, and pacing.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="100px" borderRadius="var(--radius-lg)" />
          <Skeleton height="120px" borderRadius="var(--radius-lg)" />
          <Skeleton height="120px" borderRadius="var(--radius-lg)" />
          <Skeleton height="120px" borderRadius="var(--radius-lg)" />
        </div>
      ) : isCompleted ? (
        <div className={styles.emptyState}>
          <div
            style={{
              padding: '16px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--status-success)',
              marginBottom: 'var(--space-3)',
            }}
          >
            ✓
          </div>
          <h2 className={styles.emptyStateTitle}>Daily agenda completed for today!</h2>
          <p style={{ maxWidth: '450px', color: 'var(--text-secondary)' }}>
            Great job! You have satisfied all allocated questions across your daily curriculum. Practice from the catalog or review past mistakes to build further mastery.
          </p>
        </div>
      ) : (
        <AgendaSegmentList
          segments={segments}
          onSelectActivity={handleStartActivity}
          startingActionId={startingActionId}
        />
      )}
    </div>
  );
};

export default DailyAgendaPage;
