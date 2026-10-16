// src/pages/MockReviewPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMockReview } from '../services/api/mockApi';
import { requestMockDebrief } from '../services/api/learningApi';
import { renderSanitizedMarkdown } from '../utils/markdownSanitizer';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type {
  MockReviewDetailDto,
  MockReviewQuestionDto,
  MockReviewDto,
} from '../types/api';
import styles from '../styles/pages.module.css';

export const MockReviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [reviewDetail, setReviewDetail] = useState<MockReviewDetailDto | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isAbandoned, setIsAbandoned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Post-exam AI Debrief
  const [aiDebrief, setAiDebrief] = useState<MockReviewDto | null>(null);
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);
  const [debriefError, setDebriefError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const loadReview = async () => {
      setIsLoading(true);
      setError(null);
      setIsAbandoned(false);

      try {
        const res = await fetchMockReview(sessionId);
        setReviewDetail(res.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code: unknown }).code)
            : '';
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
              : 'Unable to retrieve post-exam review. The exam may still be finalizing.'
          );
        }
      }
 finally {
        setIsLoading(false);
      }
    };

    loadReview();
  }, [sessionId]);

  // Handle AI Cooldown Countdown (ACC-13)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleRequestDebrief = async () => {
    if (!sessionId || isLoadingDebrief || cooldownSeconds > 0) return;

    setIsLoadingDebrief(true);
    setDebriefError(null);

    try {
      const res = await requestMockDebrief({ sessionId });
      setAiDebrief(res.data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'retryAfter' in err && typeof (err as { retryAfter?: number }).retryAfter === 'number') {
        setCooldownSeconds((err as { retryAfter: number }).retryAfter);
      }
      setDebriefError(
        err instanceof Error
          ? err.message
          : 'Unable to generate AI debrief at this time.'
      );
    } finally {
      setIsLoadingDebrief(false);
    }
  };

  const questions: MockReviewQuestionDto[] = reviewDetail?.questions || [];
  const currentQuestion = questions[selectedQuestionIndex];

  return (
    <div className={styles.pageContainer} data-testid="mock-review-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Post-Exam Diagnostic Review
          </h1>
          <p className={styles.pageSubtitle}>
            Full diagnostic solution walkthroughs, answer verification, and misconception debriefs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {sessionId && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/mock-exams/${sessionId}/result`)}
            >
              Back to Score Report
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => navigate('/app/mock-exams')}
          >
            Mock Catalog
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isAbandoned ? (
        <div className={styles.emptyState} data-testid="abandoned-review-notice">
          <Badge variant="error" style={{ marginBottom: 'var(--space-2)' }}>
            Exam Abandoned
          </Badge>
          <h2 className={styles.emptyStateTitle}>Review and solutions sealed</h2>
          <p style={{ maxWidth: '480px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            This examination was abandoned. Post-exam reviews, question answers, and explanations are not available for abandoned examination sessions.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/app/mock-exams')}
            style={{ marginTop: 'var(--space-4)' }}
          >
            Return to Mock Catalog
          </Button>
        </div>
      ) : isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="150px" borderRadius="var(--radius-lg)" />
          <Skeleton height="350px" borderRadius="var(--radius-lg)" />
        </div>
      ) : questions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No reviewed questions available for this session.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Post-Exam AI Debrief Section */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                  Automated Cognitive Debrief
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Synthesizes systemic pacing and pattern patterns from your exam attempt.
                </p>
              </div>

              {!aiDebrief && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRequestDebrief}
                  disabled={isLoadingDebrief || cooldownSeconds > 0}
                >
                  {isLoadingDebrief
                    ? 'Synthesizing...'
                    : cooldownSeconds > 0
                    ? `Rate Limited (${cooldownSeconds}s)`
                    : 'Generate AI Debrief'}
                </Button>
              )}
            </div>

            {debriefError && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <ErrorAlert message={debriefError} onDismiss={() => setDebriefError(null)} />
              </div>
            )}

            {aiDebrief && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div
                  style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{
                    __html: renderSanitizedMarkdown(aiDebrief.overallScoreInterpretation),
                  }}
                />

                {aiDebrief.pacingObservations && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    <strong>Pacing Analysis:</strong> {aiDebrief.pacingObservations}
                  </div>
                )}

                {aiDebrief.priorityRevisionPatterns?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Priority Remediation:</span>
                    {aiDebrief.priorityRevisionPatterns.map((pat) => (
                      <Badge key={pat} variant="warning">
                        {pat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Question Review Selector & Viewport */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 260px',
              gap: 'var(--space-5)',
              alignItems: 'start',
            }}
          >
            {/* Question Details Viewport */}
            <div>
              {currentQuestion && (
                <div>
                  <QuestionCard
                    mode="MOCK_REVIEW"
                    question={currentQuestion}
                  />

                  {/* Solution & Explanation Block */}
                  <div
                    style={{
                      marginTop: 'var(--space-4)',
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <Badge variant={currentQuestion.isCorrect ? 'success' : 'error'}>
                        {currentQuestion.isCorrect ? 'Correct (+1 mark)' : 'Incorrect (0 marks)'}
                      </Badge>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Time spent: {currentQuestion.timeSpentSeconds}s &bull; Difficulty: {currentQuestion.difficulty}/5
                      </span>
                    </div>

                    <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                      <strong>Your Answer:</strong>{' '}
                      <span style={{ color: currentQuestion.isCorrect ? 'var(--status-success)' : 'var(--status-error)' }}>
                        {currentQuestion.selectedOption || 'Not Attempted'}
                      </span>
                      {' '}&bull;{' '}
                      <strong>Correct Answer:</strong>{' '}
                      <span style={{ color: 'var(--status-success)' }}>
                        {currentQuestion.correctAnswer}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 'var(--space-3)' }}>
                      Comprehensive Explanation:
                    </h3>
                    <div
                      style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, marginTop: '4px' }}
                      dangerouslySetInnerHTML={{
                        __html: renderSanitizedMarkdown(currentQuestion.explanation),
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 'var(--space-4)',
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setSelectedQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedQuestionIndex === 0}
                >
                  Previous Question
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    setSelectedQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  disabled={selectedQuestionIndex === questions.length - 1}
                >
                  Next Question
                </Button>
              </div>
            </div>

            {/* Questions List Sidebar */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3)',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                Questions ({questions.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {questions.map((q, idx) => {
                  const isCurrent = idx === selectedQuestionIndex;
                  return (
                    <button
                      key={q.questionId}
                      type="button"
                      onClick={() => setSelectedQuestionIndex(idx)}
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isCurrent ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: q.isCorrect
                          ? 'var(--status-success-bg)'
                          : q.selectedOption
                          ? 'var(--status-error-bg)'
                          : 'var(--bg-surface-elevated)',
                        color: q.isCorrect
                          ? 'var(--status-success)'
                          : q.selectedOption
                          ? 'var(--status-error)'
                          : 'var(--text-tertiary)',
                      }}
                      aria-label={`Question ${idx + 1} ${q.isCorrect ? 'Correct' : 'Incorrect'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockReviewPage;
