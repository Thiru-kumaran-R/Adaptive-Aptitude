// src/pages/TopicDetailPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchPatternsByTopic } from '../services/api/questionApi';
import { fetchPatternMastery } from '../services/api/progressApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type { PatternMasteryItemDto } from '../types/api';
import styles from '../styles/pages.module.css';

export const TopicDetailPage: React.FC = () => {
  const { topic } = useParams<{ topic: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [patterns, setPatterns] = useState<string[]>([]);
  const [masteryList, setMasteryList] = useState<PatternMasteryItemDto[]>([]);
  const [selectedLimit, setSelectedLimit] = useState<5 | 10 | 20>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedTopic = topic ? decodeURIComponent(topic) : '';

  useEffect(() => {
    headingRef.current?.focus();
  }, [decodedTopic]);

  useEffect(() => {
    if (!decodedTopic) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const patternsRes = await fetchPatternsByTopic(decodedTopic);
        const pList = (patternsRes.data || []).map((p) => (typeof p === 'string' ? p : p.name));
        setPatterns(pList);

        if (user?.userId) {
          const masteryRes = await fetchPatternMastery(user.userId, { topic: decodedTopic }).catch(() => null);
          if (masteryRes?.data) {
            setMasteryList(masteryRes.data);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load topic patterns.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [decodedTopic, user?.userId]);

  const masteryMap = new Map(masteryList.map((m) => [m.pattern, m]));

  const handleStartDrill = (pattern: string) => {
    navigate(
      `/app/practice/${encodeURIComponent(decodedTopic)}/${encodeURIComponent(pattern)}?limit=${selectedLimit}`
    );
  };

  return (
    <div className={styles.pageContainer} data-testid="topic-detail-page">
      <div className={styles.pageHeader}>
        <div>
          <h1 ref={headingRef} tabIndex={-1} className={styles.pageTitle} style={{ outline: 'none' }}>
            Topic: {decodedTopic.replace(/_/g, ' ')}
          </h1>
          <p className={styles.pageSubtitle}>
            Browse sub-patterns, review current mastery levels, and launch targeted drill sessions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Questions per drill:</span>
          {([5, 10, 20] as const).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setSelectedLimit(count)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: selectedLimit === count ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                color: selectedLimit === count ? '#ffffff' : 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height="70px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      ) : patterns.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No patterns registered under this topic</h2>
          <p>Please return to the question catalog to explore other active topics.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {patterns.map((pat) => {
            const mastery = masteryMap.get(pat);
            const score = mastery?.mastery;
            const label =
              score !== undefined && score >= 0.8
                ? 'mastered'
                : score !== undefined && score >= 0.6
                ? 'proficient'
                : score !== undefined && score > 0
                ? 'developing'
                : 'unattempted';

            return (
              <div
                key={pat}
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
              >
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {pat}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <Badge
                      variant={
                        label === 'mastered'
                          ? 'success'
                          : label === 'proficient'
                          ? 'info'
                          : label === 'developing'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {label}
                    </Badge>
                    {score !== undefined && score !== null && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        Mastery: {(score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartDrill(pat)}
                >
                  Start Drill ({selectedLimit} Qs)
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopicDetailPage;
