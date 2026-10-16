// src/pages/RevisionQueuePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchRevisionDue,
  fetchRevisionPlan,
  rebuildRevisionQueue,
} from '../services/api/revisionApi';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type { RevisionDueItemDto, RevisionPlanProjectionDto } from '../types/api';
import styles from '../styles/pages.module.css';

const STAGE_LABELS: Record<number, string> = {
  0: 'Stage 0 (1d)',
  1: 'Stage 1 (3d)',
  2: 'Stage 2 (7d)',
  3: 'Stage 3 (14d)',
  4: 'Stage 4 (30d)',
};

export const RevisionQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prescriptionId = searchParams.get('prescriptionId') || undefined;

  const [dueItems, setDueItems] = useState<RevisionDueItemDto[]>([]);
  const [planProjection, setPlanProjection] = useState<RevisionPlanProjectionDto | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rebuildSuccess, setRebuildSuccess] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const loadRevisionData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dueRes, planRes] = await Promise.all([
        fetchRevisionDue(),
        fetchRevisionPlan({ days: selectedHorizon }),
      ]);

      const rawData = dueRes.data;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as any)?.duePatterns)
        ? (rawData as any).duePatterns
        : [];
      setDueItems(items);
      setPlanProjection(planRes.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
            ? err.message
            : 'Failed to retrieve spaced revision queue.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevisionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHorizon]);

  const handleRebuild = async () => {
    setIsRebuilding(true);
    setError(null);
    setRebuildSuccess(null);

    try {
      const res = await rebuildRevisionQueue({});
      setRebuildSuccess(res.message || 'Revision queue rebuilt successfully.');
      await loadRevisionData();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to rebuild spaced revision schedule.'
      );
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleStartRevisionDrill = (item: RevisionDueItemDto) => {
    const pIdQuery = prescriptionId ? `&prescriptionId=${encodeURIComponent(prescriptionId)}` : '';
    navigate(
      `/app/practice/${encodeURIComponent(item.topic)}/${encodeURIComponent(item.pattern)}?source=revision${pIdQuery}`
    );
  };

  return (
    <div className={styles.pageContainer} data-testid="revision-queue-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Fixed-Stage Spaced Retention Practice
          </h1>
          <p className={styles.pageSubtitle}>
            Deterministic 5-stage interval scheduling (1d &rarr; 3d &rarr; 7d &rarr; 14d &rarr; 30d) based strictly on verified historical retention.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRebuild}
            disabled={isRebuilding || isLoading}
          >
            {isRebuilding ? 'Rebuilding Queue...' : 'Rebuild Queue'}
          </Button>
          {prescriptionId && <Badge variant="success">Prescribed Revision</Badge>}
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {rebuildSuccess && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
            border: '1px solid var(--border-subtle)',
          }}
          role="status"
        >
          {rebuildSuccess}
        </div>
      )}

      {/* Horizon Projection Panel */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-3)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
            Revision Horizon Projection
          </h2>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Horizon:
            </span>
            {([1, 2] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setSelectedHorizon(days)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor:
                    selectedHorizon === days
                      ? 'var(--accent-primary)'
                      : 'var(--bg-surface-elevated)',
                  color: selectedHorizon === days ? '#ffffff' : 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {days} Day{days > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        {planProjection && planProjection.projections && (
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {planProjection.projections.map((proj, idx) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  flex: '1 1 200px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Date: {new Date(proj.date).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginTop: '2px' }}>
                  {proj.count} pattern{proj.count !== 1 ? 's' : ''} due
                </div>
                {proj.patterns && proj.patterns.length > 0 && (
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      marginTop: '4px',
                    }}
                  >
                    Patterns: {proj.patterns.slice(0, 3).join(', ')}
                    {proj.patterns.length > 3 ? ` +${proj.patterns.length - 3} more` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Due Items List */}
      <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
        Patterns Due for Spaced Review ({dueItems.length})
      </h2>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height="70px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      ) : dueItems.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>All caught up on spaced revisions!</h2>
          <p>
            No patterns currently require spaced review for your chosen horizon. Practice new questions or take a mock exam.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/app/practice')}
            style={{ marginTop: 'var(--space-3)' }}
          >
            Go to Practice Catalog
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {dueItems.map((item) => {
            const stageLabel = STAGE_LABELS[item.stage] || `Stage ${item.stage}`;
            return (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
                data-testid="revision-due-item"
              >
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge variant="warning">{stageLabel}</Badge>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {item.topic}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Due: {new Date(item.dueDate).toDateString() === new Date().toDateString() ? 'Due Today' : new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      marginTop: '4px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.pattern}
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Reason: {item.reasonCode.replace(/_/g, ' ')} &bull; Current Mastery:{' '}
                    {(item.mastery * 100).toFixed(0)}%
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartRevisionDrill(item)}
                >
                  Start Revision
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RevisionQueuePage;
