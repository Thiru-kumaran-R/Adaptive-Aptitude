// src/pages/MockResultPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMockResult } from '../services/api/mockApi';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type { MockScoringResultDto } from '../types/api';
import styles from '../styles/pages.module.css';

export const MockResultPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [result, setResult] = useState<MockScoringResultDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAbandoned, setIsAbandoned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const loadResult = async () => {
      setIsLoading(true);
      setError(null);
      setIsAbandoned(false);

      try {
        const res = await fetchMockResult(sessionId);
        setResult(res.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code: unknown }).code)
            : '';
        // If abandoned or invalid state, backend rejects score exposure
        if (
          code === 'MOCK_SESSION_NOT_TERMINAL' ||
          code.includes('MOCK_SESSION_NOT_TERMINAL') ||
          code.includes('ABANDONED') ||
          msg.includes('MOCK_SESSION_NOT_TERMINAL') ||
          msg.includes('abandoned') ||
          msg.includes('ABANDONED') ||
          msg.includes('TERMINATED')
        ) {
          setIsAbandoned(true);
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to retrieve score report. The exam may still be finalizing.'
          );
        }
      }
 finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [sessionId]);

  return (
    <div className={styles.pageContainer} data-testid="mock-result-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Examination Score Report
          </h1>
          <p className={styles.pageSubtitle}>
            {isAbandoned
              ? 'Examination session terminated and sealed.'
              : 'Authoritative performance diagnostics, section breakdown, and percentile estimates.'}
          </p>
        </div>

        {sessionId && !isAbandoned && (
          <Button
            variant="primary"
            onClick={() => navigate(`/app/mock-exams/${sessionId}/review`)}
          >
            Review Questions & Solutions
          </Button>
        )}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Screen reader live announcement on backend-confirmed score calculation completion */}
      {result && (
        <div aria-live="polite" className="sr-only">
          Score calculation complete. Final score: {result.totalScore} out of {result.maxScore}.
        </div>
      )}

      {isAbandoned ? (
        <div className={styles.emptyState} data-testid="abandoned-exam-notice">
          <Badge variant="error" style={{ marginBottom: 'var(--space-2)' }}>
            Exam Abandoned
          </Badge>
          <h2 className={styles.emptyStateTitle}>No score report available</h2>
          <p style={{ maxWidth: '480px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            This examination session was explicitly abandoned by the learner. Per standardized assessment policy, abandoned examinations forfeit authoritative scoring and diagnostic reviews.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/app/mock-exams')}
            style={{ marginTop: 'var(--space-4)' }}
          >
            Return to Mock Exams
          </Button>
        </div>
      ) : isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="150px" borderRadius="var(--radius-lg)" />
          <Skeleton height="250px" borderRadius="var(--radius-lg)" />
        </div>
      ) : result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Hero Metrics Overview */}
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
                Overall Score
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
                {result.totalScore} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>/ {result.maxScore}</span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {(result.percentage ?? 100).toFixed(1)}% marks
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
                {((result.accuracy ?? 1) * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Correct answers proportion
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
                Time Invested
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {Math.round(result.totalTimeSpentSeconds / 60)} <span style={{ fontSize: 'var(--text-sm)' }}>mins</span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {result.totalTimeSpentSeconds} seconds total
              </div>
            </div>

            {result.percentile !== undefined && result.percentile !== null && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Percentile Rank
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--status-info)', marginTop: '4px' }}>
                  {result.percentile}th Percentile
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Norm-referenced cohort rank
                </div>
              </div>
            )}
          </div>

          {/* Sectional Breakdown */}
          {result.sectionScores && result.sectionScores.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                Section Performance Breakdown
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {result.sectionScores.map((sec, idx) => (
                  <div
                    key={sec.sectionId || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>Section {idx + 1}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ID: {sec.sectionId}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {sec.score} / {sec.maxScore} marks
                      </span>
                      <Badge variant={(sec.accuracy ?? 1) >= 0.7 ? 'success' : (sec.accuracy ?? 1) >= 0.4 ? 'warning' : 'error'}>
                        {((sec.accuracy ?? 1) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="primary"
              onClick={() => navigate(`/app/mock-exams/${sessionId}/review`)}
            >
              Review Questions & Solutions
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/app/mock-exams')}
            >
              Return to Catalog
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No score report data available.</p>
        </div>
      )}
    </div>
  );
};

export default MockResultPage;
