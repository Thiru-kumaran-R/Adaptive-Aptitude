// src/pages/AnalyticsDashboardPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAnalyticsDashboard,
  fetchCognitiveProfile,
  fetchRetentionAnalytics,
  fetchExamReadiness,
} from '../services/api/analyticsApi';
import { fetchUserGoals } from '../services/api/goalApi';
import { CognitiveDiagnosticsSvg } from '../components/charts/CognitiveDiagnosticsSvg';
import { RetentionEvidenceSvg } from '../components/charts/RetentionEvidenceSvg';
import { ReadinessMeter } from '../components/dashboard/ReadinessMeter';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type {
  AnalyticsDashboardResponseDto,
  CognitiveProfileResponseDto,
  RetentionAnalyticsResponseDto,
  ExamReadinessResponseDto,
} from '../types/api';
import styles from '../styles/pages.module.css';

export const AnalyticsDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardResponseDto | null>(null);
  const [profileData, setProfileData] = useState<CognitiveProfileResponseDto | null>(null);
  const [retentionData, setRetentionData] = useState<RetentionAnalyticsResponseDto | null>(null);
  const [readinessData, setReadinessData] = useState<ExamReadinessResponseDto | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [dashRes, profRes, retRes, goalsRes] = await Promise.all([
          fetchAnalyticsDashboard({ userId: user.userId }).catch(() => null),
          fetchCognitiveProfile({ userId: user.userId }).catch(() => null),
          fetchRetentionAnalytics({ userId: user.userId }).catch(() => null),
          fetchUserGoals(user.userId).catch(() => null),
        ]);

        if (dashRes) setDashboardData(dashRes.data);
        if (profRes) setProfileData(profRes.data);
        if (retRes) setRetentionData(retRes.data);

        const primaryGoalId = goalsRes?.data?.[0]?._id;
        if (primaryGoalId) {
          const readyRes = await fetchExamReadiness(primaryGoalId, {
            userId: user.userId,
          }).catch(() => null);
          if (readyRes) setReadinessData(readyRes.data);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to retrieve cognitive diagnostics at this time.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [user?.userId]);

  return (
    <div className={styles.pageContainer} data-testid="analytics-dashboard-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Cognitive Analytics & Readiness Diagnostics
          </h1>
          <p className={styles.pageSubtitle}>
            Evidence-backed cognitive profiler, speed-accuracy dispersion, stamina quartiles, and retention tracking.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height="100px" borderRadius="var(--radius-lg)" />
            ))}
          </div>
          <Skeleton height="350px" borderRadius="var(--radius-lg)" />
          <Skeleton height="300px" borderRadius="var(--radius-lg)" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Summary Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Total Attempts Analyzed
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {dashboardData?.summary?.totalPracticeAttempts ?? 0}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Practice & drill telemetry
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Overall Accuracy
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--status-success)', marginTop: '4px' }}>
                {dashboardData?.summary?.overallAccuracy !== null &&
                dashboardData?.summary?.overallAccuracy !== undefined
                  ? `${(dashboardData.summary.overallAccuracy * 100).toFixed(0)}%`
                  : 'N/A'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {dashboardData?.summary?.overallAccuracy !== null ? 'Aggregated correctness' : 'Insufficient attempts'}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Standardized Mocks
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
                {dashboardData?.summary?.totalMocksCompleted ?? 0}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Full-length assessments
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Revisions Due
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--status-warning)', marginTop: '4px' }}>
                {dashboardData?.dueRevisionCount ?? 0}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Fixed-stage spaced items
              </div>
            </div>
          </div>

          {/* Readiness Meter & Prerequisite Bottlenecks */}
          {readinessData && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--space-4)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <div>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Examination Readiness Assessment
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Target: {readinessData.goalTitle} &bull; Date: {readinessData.targetDate ? new Date(readinessData.targetDate).toLocaleDateString() : 'Unscheduled'}
                </p>

                {readinessData.criticalPrerequisiteBottlenecks?.length > 0 && (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--status-error)', marginBottom: '4px' }}>
                      Critical Prerequisite Bottlenecks:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {readinessData.criticalPrerequisiteBottlenecks.map((b, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: 'var(--text-xs)',
                            padding: '4px 8px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <strong>{b.targetPattern}</strong> &bull; Blocked by:{' '}
                          <em>{b.unmasteredPrerequisite}</em> (Mastery:{' '}
                          {(b.prerequisiteMastery * 100).toFixed(0)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ReadinessMeter
                  score={readinessData.readinessScore}
                  status={readinessData.readinessStatus}
                  reason={readinessData.reason}
                />
              </div>
            </div>
          )}

          {/* Cognitive Profile & Speed-Accuracy Matrix */}
          <CognitiveDiagnosticsSvg data={profileData} />

          {/* Observed Retention Evidence (Spaced Repetition Decay) */}
          <RetentionEvidenceSvg data={retentionData} />

          {/* Topic Mastery Distribution */}
          {dashboardData?.topicMasteryRadar && dashboardData.topicMasteryRadar.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                Topic Mastery Distribution
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {dashboardData.topicMasteryRadar.map((topicItem) => (
                  <div
                    key={topicItem.topic}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{topicItem.topic}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        {topicItem.practiceAttempts} attempts
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Badge
                        variant={
                          topicItem.masteryScore >= 0.8
                            ? 'success'
                            : topicItem.masteryScore >= 0.6
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {(topicItem.masteryScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboardPage;
