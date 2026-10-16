// src/pages/MockSessionPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchMockSession,
  startMockSession,
  fetchMockQuestion,
  saveMockResponse,
  completeMockSection,
  submitMockSession,
  abandonMockSession,
  fetchMockResult,
} from '../services/api/mockApi';
import { ApiClientError } from '../services/api/apiClient';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { QuestionPalette } from '../components/quiz/QuestionPalette';
import { ExamTimer } from '../components/quiz/ExamTimer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type {
  MockSessionDetailDto,
  ActiveMockQuestionDto,
} from '../types/api';
import styles from '../styles/pages.module.css';

interface LocalPaletteItem {
  questionId: string;
  order: number;
  isAnswered: boolean;
  isFlagged: boolean;
  selectedOption?: string | null;
}

export const MockSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [session, setSession] = useState<MockSessionDetailDto | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ActiveMockQuestionDto | null>(null);
  const [paletteItems, setPaletteItems] = useState<LocalPaletteItem[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
  const [isMutationsDisabled, setIsMutationsDisabled] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, []);

  // Step 1: Load or Start Session
  useEffect(() => {
    if (!sessionId) return;

    const initSession = async () => {
      setIsLoadingSession(true);
      setError(null);

      try {
        let res = await fetchMockSession(sessionId);

        // If newly created, start it
        if (res.data.status === 'created') {
          const startRes = await startMockSession(sessionId);
          res = await fetchMockSession(sessionId);
          setSession({ ...res.data, ...startRes.data });
        } else if (res.data.status === 'submitted' || res.data.status === 'expired') {
          navigate(`/app/mock-exams/${sessionId}/result`);
          return;
        } else if (res.data.status === 'abandoned') {
          navigate('/app/mock-exams');
          return;
        } else {
          setSession(res.data);
        }

        // Initialize question palette from current section
        const currSection = res.data.sections?.find((s) => s.sectionId === res.data.currentSectionId) || res.data.sections?.[0];
        const qCount = currSection?.questionCount || 10;
        const initialItems: LocalPaletteItem[] = Array.from({ length: qCount }, (_, i) => ({
          questionId: `q-${i + 1}`,
          order: i + 1,
          isAnswered: false,
          isFlagged: false,
          isCurrent: i === 0,
        }));
        setPaletteItems(initialItems);

        // Load the first question
        await loadQuestion(sessionId, initialItems[0].questionId, 0);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize mock examination session.'
        );
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadQuestion = async (sessId: string, qId: string, index: number) => {
    setIsLoadingQuestion(true);
    setError(null);
    setSelectedOption(null);
    setIsFlagged(false);

    try {
      const qRes = await fetchMockQuestion(sessId, qId);
      setCurrentQuestion(qRes.data);
      setActiveQuestionIndex(index);
      setQuestionStartTime(Date.now());

      setPaletteItems((prev) =>
        prev.map((item, idx) => ({
          ...item,
          isCurrent: idx === index,
        }))
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve exam question.'
      );
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleSelectOption = async (option: string) => {
    if (!sessionId || !currentQuestion || isSaving || session?.responsesFrozen || isMutationsDisabled) return;

    setSelectedOption(option);
    setIsSaving(true);
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

    try {
      await saveMockResponse(sessionId, {
        questionId: currentQuestion.questionId,
        sectionId: currentQuestion.sectionId,
        selectedOption: option,
        timeSpentSeconds: timeSpent,
        isFlagged,
      });

      // Update palette status
      setPaletteItems((prev) =>
        prev.map((item, idx) =>
          idx === activeQuestionIndex
            ? { ...item, isAnswered: true, selectedOption: option }
            : item
        )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to autosave response. Please re-select option.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFlag = async () => {
    if (!sessionId || !currentQuestion || isMutationsDisabled) return;

    const nextFlag = !isFlagged;
    setIsFlagged(nextFlag);

    setPaletteItems((prev) =>
      prev.map((item, idx) =>
        idx === activeQuestionIndex ? { ...item, isFlagged: nextFlag } : item
      )
    );

    if (selectedOption) {
      saveMockResponse(sessionId, {
        questionId: currentQuestion.questionId,
        sectionId: currentQuestion.sectionId,
        selectedOption,
        isFlagged: nextFlag,
      }).catch(() => null);
    }
  };

  const handleSelectFromPalette = async (index: number) => {
    if (!sessionId || index === activeQuestionIndex || !paletteItems[index] || isMutationsDisabled) return;
    await loadQuestion(sessionId, paletteItems[index].questionId, index);
  };

  const handleNext = async () => {
    if (isMutationsDisabled) return;
    if (activeQuestionIndex < paletteItems.length - 1) {
      await handleSelectFromPalette(activeQuestionIndex + 1);
    }
  };

  const handlePrev = async () => {
    if (isMutationsDisabled) return;
    if (activeQuestionIndex > 0) {
      await handleSelectFromPalette(activeQuestionIndex - 1);
    }
  };

  // Section 34.2 & ACC-11: Zero-Time Client Expiry Behavior
  // 1. Immediately disable further answer option selection and mutations.
  // 2. Client DOES NOT fabricate local expired or submitted.
  // 3. Client DOES NOT trigger manual POST .../submit.
  // 4. Initiates authoritative server inquiry via GET /api/v1/mock-sessions/:id/result.
  // 5. If server returns HTTP 409 (FINALIZATION_IN_PROGRESS):
  //    Enters bounded polling: polls GET .../result every 2000 ms for maximum 30 attempts (60s).
  //    Aborts polling if server returns 200 (Success) or 400 (Terminal Error).
  //    Once HTTP 200 is confirmed, navigates to RESULT_VIEW.
  const handleZeroTime = async () => {
    if (!sessionId || isFinalizing) return;
    setIsMutationsDisabled(true);
    setIsFinalizing(true);

    let attempts = 0;
    const maxAttempts = 30;
    const pollInterval = 2000;

    const pollResult = async () => {
      attempts++;
      try {
        await fetchMockResult(sessionId);
        // Authoritative HTTP 200 terminal state confirmed -> navigate to result view
        navigate(`/app/mock-exams/${sessionId}/result`);
      } catch (err: unknown) {
        if (err instanceof ApiClientError && err.statusCode === 409) {
          if (attempts < maxAttempts) {
            pollingTimerRef.current = setTimeout(pollResult, pollInterval);
          } else {
            setError(
              'Examination finalization exceeded maximum duration (60s). Please refresh to view your results.'
            );
          }
        } else {
          // Terminal error (e.g. 400 or other non-409)
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to retrieve authoritative examination results.'
          );
        }
      }
    };

    await pollResult();
  };

  const handleConfirmSubmit = async () => {
    if (!sessionId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // If current section needs completion first
      if (session?.currentSectionId) {
        await completeMockSection(sessionId, session.currentSectionId).catch(() => null);
      }

      await submitMockSession(sessionId);
      setIsSubmitModalOpen(false);
      navigate(`/app/mock-exams/${sessionId}/result`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit examination. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const handleConfirmAbandon = async () => {
    if (!sessionId || isAbandoning) return;

    setIsAbandoning(true);
    setError(null);

    try {
      await abandonMockSession(sessionId);
      setIsAbandonModalOpen(false);
      navigate('/app/mock-exams');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to abandon examination.'
      );
      setIsAbandoning(false);
    }
  };

  const currentSection = session?.sections?.find(
    (s) => s.sectionId === session.currentSectionId
  );

  return (
    <div className={styles.pageContainer} data-testid="active-mock-session-page">
      {/* Distraction-Free Exam Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              margin: 0,
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          >
            Mock Examination
          </h1>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Section: {currentSection?.name || 'Aptitude'} &bull; Question{' '}
            {activeQuestionIndex + 1} of {paletteItems.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {session?.expiresAt && (
            <ExamTimer
              expiresAt={session.expiresAt}
              onZeroTime={handleZeroTime}
            />
          )}

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsAbandonModalOpen(true)}
            disabled={isMutationsDisabled || isAbandoning}
          >
            Abandon Exam
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={isMutationsDisabled || isSubmitting}
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoadingSession ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="300px" borderRadius="var(--radius-lg)" />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: 'var(--space-5)',
            alignItems: 'start',
          }}
        >
          {/* Main Question Viewport (Anti-Leakage Protected) */}
          <div>
            {isLoadingQuestion ? (
              <Skeleton height="350px" borderRadius="var(--radius-lg)" />
            ) : currentQuestion ? (
              <div>
                <QuestionCard
                  mode="MOCK_EXAM"
                  question={currentQuestion}
                  selectedOption={selectedOption}
                  onSelectOption={handleSelectOption}
                  onFlagForReview={handleToggleFlag}
                  isFlagged={isFlagged}
                  isSubmitting={isSaving || isMutationsDisabled}
                />

                {/* Question Navigation Controls */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'var(--space-4)',
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={handlePrev}
                    disabled={isMutationsDisabled || activeQuestionIndex === 0}
                  >
                    Previous Question
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleToggleFlag}
                    disabled={isMutationsDisabled}
                  >
                    {isFlagged ? 'Unmark Flag' : 'Mark for Review'}
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={isMutationsDisabled || activeQuestionIndex === paletteItems.length - 1}
                  >
                    Next Question
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No active question loaded.</p>
              </div>
            )}
          </div>

          {/* Question Palette Sidebar */}
          <div>
            <QuestionPalette
              totalQuestions={paletteItems.length}
              currentIndex={activeQuestionIndex}
              answeredIndices={paletteItems.flatMap((item, idx) =>
                item.isAnswered ? [idx] : []
              )}
              flaggedIndices={paletteItems.flatMap((item, idx) =>
                item.isFlagged ? [idx] : []
              )}
              onSelectIndex={handleSelectFromPalette}
            />
          </div>
        </div>
      )}

      {/* Confirm Submission Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => !isSubmitting && setIsSubmitModalOpen(false)}
        title="Confirm Exam Submission"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Are you sure you want to finalize and submit your examination? Once submitted, your answers will be locked and an authoritative score report will be computed.
          </p>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div>Answered: {paletteItems.filter((i) => i.isAnswered).length} / {paletteItems.length}</div>
            <div>Flagged for Review: {paletteItems.filter((i) => i.isFlagged).length}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              Continue Test
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Finalizing...' : 'Yes, Submit Exam'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Abandon Modal */}
      <Modal
        isOpen={isAbandonModalOpen}
        onClose={() => !isAbandoning && setIsAbandonModalOpen(false)}
        title="Abandon Examination"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--status-error)', lineHeight: 1.6 }}>
            Warning: Abandoning an exam terminates the session immediately. Abandoned exams do NOT produce score reports or post-exam review explanations.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              onClick={() => setIsAbandonModalOpen(false)}
              disabled={isAbandoning}
            >
              Resume Exam
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmAbandon}
              disabled={isAbandoning}
            >
              {isAbandoning ? 'Abandoning...' : 'Confirm Abandon Exam'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MockSessionPage;
