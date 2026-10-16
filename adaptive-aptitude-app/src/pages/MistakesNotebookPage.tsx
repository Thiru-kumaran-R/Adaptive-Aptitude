// src/pages/MistakesNotebookPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserAttempts } from '../services/api/attemptApi';
import { ExplanationDrawer } from '../components/quiz/ExplanationDrawer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type { AttemptRecordDto } from '../types/api';
import styles from '../styles/pages.module.css';

export const MistakesNotebookPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [attempts, setAttempts] = useState<AttemptRecordDto[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptRecordDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilterTopic, setSelectedFilterTopic] = useState<string>('ALL');

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const loadMistakes = async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchUserAttempts(user.userId, { limit: 50 });
      // Filter for incorrect attempts
      const incorrectAttempts = (res.data || []).filter((a) => !a.isCorrect);
      setAttempts(incorrectAttempts);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve mistake notebook entries.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMistakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const uniqueTopics = Array.from(new Set(attempts.map((a) => a.topic)));

  const filteredAttempts =
    selectedFilterTopic === 'ALL'
      ? attempts
      : attempts.filter((a) => a.topic === selectedFilterTopic);

  const handleOpenExplanation = (attempt: AttemptRecordDto) => {
    setSelectedAttempt(attempt);
    setIsDrawerOpen(true);
  };

  return (
    <div className={styles.pageContainer} data-testid="mistakes-notebook-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Mistake Remediation Notebook
          </h1>
          <p className={styles.pageSubtitle}>
            Systematic repository of missed concepts, misconception analyses, and targeted remediation drills.
          </p>
        </div>

        {uniqueTopics.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Topic:</span>
            <select
              value={selectedFilterTopic}
              onChange={(e) => setSelectedFilterTopic(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-xs)',
              }}
              aria-label="Filter mistakes by topic"
            >
              <option value="ALL">All Topics ({attempts.length})</option>
              {uniqueTopics.map((top) => (
                <option key={top} value={top}>
                  {top} ({attempts.filter((a) => a.topic === top).length})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height="80px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No mistakes logged</h2>
          <p>
            {selectedFilterTopic === 'ALL'
              ? 'Excellent performance! You currently have zero recorded errors in your mistake notebook.'
              : `No errors recorded for topic ${selectedFilterTopic}.`}
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/app/practice')}
            style={{ marginTop: 'var(--space-3)' }}
          >
            Practice New Questions
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filteredAttempts.map((attempt) => (
            <div
              key={attempt._id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
              data-testid="mistake-item"
            >
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <Badge variant="error">Incorrect</Badge>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {attempt.topic} &bull; {attempt.pattern}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Difficulty {attempt.difficulty}/5
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  Selected Option: <strong style={{ color: 'var(--status-error)' }}>{attempt.selectedAnswer}</strong> &bull; Time:{' '}
                  {attempt.timeTaken}s &bull; Source: {attempt.source}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenExplanation(attempt)}
                >
                  Diagnose Misconception
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/app/practice/${encodeURIComponent(attempt.topic)}/${encodeURIComponent(attempt.pattern)}`
                    )
                  }
                >
                  Practice Pattern
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAttempt && (
        <ExplanationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Misconception Diagnosis: ${selectedAttempt.pattern}`}
          explanation={`### Diagnostic Remediation for ${selectedAttempt.pattern}\n\n- **Topic:** ${selectedAttempt.topic}\n- **Your Response:** \`${selectedAttempt.selectedAnswer}\` (Incorrect)\n- **Time Spent:** ${selectedAttempt.timeTaken} seconds\n\n#### Recommended Strategy:\nReview the fundamental proportional or algebraic equations governing this pattern before attempting additional drills.`}
        />
      )}
    </div>
  );
};

export default MistakesNotebookPage;
