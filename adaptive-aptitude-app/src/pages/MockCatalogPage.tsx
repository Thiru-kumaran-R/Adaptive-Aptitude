// src/pages/MockCatalogPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMockBlueprints, createMockSession } from '../services/api/mockApi';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type { MockBlueprintDto } from '../types/api';
import styles from '../styles/pages.module.css';

export const MockCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [blueprints, setBlueprints] = useState<MockBlueprintDto[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<MockBlueprintDto | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const loadBlueprints = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchMockBlueprints();
        setBlueprints(res.data || []);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load mock examination catalog.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBlueprints();
  }, []);

  const handleOpenConfirm = (blueprint: MockBlueprintDto) => {
    setSelectedBlueprint(blueprint);
    setIsConfirmModalOpen(true);
  };

  const handleStartExam = async () => {
    if (!selectedBlueprint || isStarting) return;

    setIsStarting(true);
    setError(null);

    try {
      const res = await createMockSession({
        blueprintId: selectedBlueprint._id,
      });

      const sessionId = res.data._id || (res.data as unknown as { sessionId?: string }).sessionId;
      setIsConfirmModalOpen(false);
      navigate(`/app/mock-exams/${sessionId}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to initialize exam session. Please try again.'
      );
      setIsStarting(false);
    }
  };

  return (
    <div className={styles.pageContainer} data-testid="mock-catalog-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Mock Examination Catalog
          </h1>
          <p className={styles.pageSubtitle}>
            Timed full-length assessments with section pacing, anti-leakage protection, and post-exam diagnostic review.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height="180px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      ) : blueprints.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No mock exams available</h2>
          <p>Mock examination blueprints are being calibrated. Please check back shortly.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {blueprints.map((bp) => {
            const totalQuestions = bp.sections?.reduce((sum, s) => sum + (s.questionCount || 0), 0) || 0;

            return (
              <div
                key={bp._id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                data-testid="blueprint-card"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <Badge variant={bp.mode === 'adaptive' ? 'info' : 'neutral'}>
                      {(bp.mode || 'standard').replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {bp.totalDurationMinutes || 30} mins
                    </span>
                  </div>

                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {bp.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      marginTop: 'var(--space-2)',
                      lineHeight: 1.5,
                    }}
                  >
                    {bp.description || 'Comprehensive multi-section aptitude simulation.'}
                  </p>

                  <div
                    style={{
                      marginTop: 'var(--space-3)',
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div>Sections: {bp.sections?.length || 1}</div>
                    <div>Total Questions: {totalQuestions}</div>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Button
                    variant="primary"
                    onClick={() => handleOpenConfirm(bp)}
                    style={{ width: '100%' }}
                  >
                    Launch Mock Exam
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedBlueprint && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => !isStarting && setIsConfirmModalOpen(false)}
          title={`Launch ${selectedBlueprint.title}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              You are about to launch a timed standardized mock examination. Please ensure you have a quiet environment and stable connectivity.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div><strong>Total Duration:</strong> {selectedBlueprint.totalDurationMinutes} minutes</div>
              <div><strong>Sections:</strong> {selectedBlueprint.sections?.length || 1}</div>
              <div><strong>Anti-Cheat Policy:</strong> Active mock viewports seal answers, solutions, and AI assistance until completion.</div>
              <div><strong>Abandon Policy:</strong> An abandoned exam forfeits score reports and diagnostic reviews.</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button
                variant="ghost"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isStarting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleStartExam}
                disabled={isStarting}
              >
                {isStarting ? 'Initializing Exam...' : 'Begin Examination'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MockCatalogPage;
