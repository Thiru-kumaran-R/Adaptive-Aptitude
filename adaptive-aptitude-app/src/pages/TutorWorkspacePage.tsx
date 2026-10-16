// src/pages/TutorWorkspacePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchTopics, fetchPatternsByTopic } from '../services/api/questionApi';
import { TutorChatWindow } from '../components/ai/TutorChatWindow';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import styles from '../styles/pages.module.css';

export const TutorWorkspacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const initialTopic = searchParams.get('topic') || '';
  const initialPattern = searchParams.get('pattern') || '';
  const questionIdParam = searchParams.get('questionId') || undefined;

  const [topics, setTopics] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [selectedPattern, setSelectedPattern] = useState<string>(initialPattern);

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Load available topics for tutor context
  useEffect(() => {
    const loadTopics = async () => {
      setIsLoadingMetadata(true);
      setError(null);
      try {
        const res = await fetchTopics();
        const tList = res.data || [];
        setTopics(tList);
        if (!selectedTopic && tList.length > 0) {
          setSelectedTopic(tList[0]);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load topic catalog for tutor context.'
        );
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selected topic changes, load patterns
  useEffect(() => {
    if (!selectedTopic) return;

    const loadPatterns = async () => {
      try {
        const res = await fetchPatternsByTopic(selectedTopic);
        const pList = (res.data || []).map((p) => (typeof p === 'string' ? p : p.name));
        setPatterns(pList);
        if (!selectedPattern || !pList.includes(selectedPattern)) {
          setSelectedPattern(pList[0] || '');
        }
      } catch {
        setPatterns([]);
      }
    };

    loadPatterns();
  }, [selectedTopic, selectedPattern]);

  return (
    <div className={styles.pageContainer} data-testid="tutor-workspace-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Socratic AI Tutor Workspace
          </h1>
          <p className={styles.pageSubtitle}>
            Interactive concept explanations, step-by-step guidance, and misconception remediation without revealing final solutions prematurely.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Context Selection Bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label htmlFor="tutor-topic-select" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            Topic:
          </label>
          <select
            id="tutor-topic-select"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-xs)',
            }}
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label htmlFor="tutor-pattern-select" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            Pattern:
          </label>
          <select
            id="tutor-pattern-select"
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            disabled={patterns.length === 0}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-xs)',
            }}
          >
            {patterns.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {questionIdParam && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)' }}>
            Focused on Question ID: {questionIdParam}
          </span>
        )}
      </div>

      {isLoadingMetadata ? (
        <Skeleton height="400px" borderRadius="var(--radius-lg)" />
      ) : (
        <TutorChatWindow
          topic={selectedTopic}
          pattern={selectedPattern}
          questionId={questionIdParam}
        />
      )}
    </div>
  );
};

export default TutorWorkspacePage;
