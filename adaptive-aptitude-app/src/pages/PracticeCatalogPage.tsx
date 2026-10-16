// src/pages/PracticeCatalogPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTopics } from '../services/api/questionApi';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { BookOpen, Search } from 'lucide-react';
import styles from '../styles/pages.module.css';

export const PracticeCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [topics, setTopics] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const loadTopics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchTopics();
        const topicList = res.data || [];
        setTopics(topicList);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load topic catalog.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTopics();
  }, []);

  const filteredTopics = topics.filter((t) =>
    t.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className={styles.pageContainer} data-testid="practice-catalog-page">
      <div className={styles.pageHeader}>
        <div>
          <h1 ref={headingRef} tabIndex={-1} className={styles.pageTitle} style={{ outline: 'none' }}>
            Practice Question Bank
          </h1>
          <p className={styles.pageSubtitle}>
            Select any topic from the 24 canonical engineering aptitude categories to explore patterns and practice drills.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className={styles.filterBar}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
            }}
            aria-label="Search topics"
          />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.catalogGrid}>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} height="120px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No topics match your search criteria</h2>
          <p>Try clearing your search query to see all 24 engineering categories.</p>
        </div>
      ) : (
        <div className={styles.catalogGrid}>
          {filteredTopics.map((topic) => (
            <div
              key={topic}
              onClick={() => navigate(`/app/practice/${encodeURIComponent(topic)}`)}
              className={styles.topicCard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/app/practice/${encodeURIComponent(topic)}`);
                }
              }}
              aria-label={`Open topic ${topic.replace(/_/g, ' ')}`}
            >
              <div>
                <BookOpen size={20} color="var(--accent-primary)" style={{ marginBottom: 'var(--space-2)' }} aria-hidden="true" />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {topic.replace(/_/g, ' ')}
                </h3>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', marginTop: 'var(--space-4)', fontWeight: 500 }}>
                Explore Patterns →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeCatalogPage;
