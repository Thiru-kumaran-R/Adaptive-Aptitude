// src/pages/AdaptivePracticePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchAdaptiveNextQuestion } from '../services/api/adaptiveApi';
import { recordAttempt } from '../services/api/attemptApi';
import { completePrescription } from '../services/api/orchestrationApi';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { HintAccordion } from '../components/ai/HintAccordion';
import { ExplanationDrawer } from '../components/quiz/ExplanationDrawer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type {
  AdaptiveQuestionDto,
  AdaptiveDecisionDto,
  AttemptRecordDto,
  QuestionDto,
} from '../types/api';
import styles from '../styles/pages.module.css';

export const AdaptivePracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const topicParam = searchParams.get('topic') || undefined;
  const patternParam = searchParams.get('pattern') || undefined;
  const prescriptionId = searchParams.get('prescriptionId') || undefined;

  const [question, setQuestion] = useState<AdaptiveQuestionDto | null>(null);
  const [decision, setDecision] = useState<AdaptiveDecisionDto | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  // Authoritative feedback returned from backend attempt
  const [attemptFeedback, setAttemptFeedback] = useState<AttemptRecordDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const loadNextAdaptiveQuestion = async () => {
    setIsLoadingQuestion(true);
    setError(null);
    setSelectedOption(null);
    setAttemptFeedback(null);
    setIsDrawerOpen(false);

    try {
      const res = await fetchAdaptiveNextQuestion({
        topic: topicParam,
        pattern: patternParam,
      });

      setQuestion(res.data.question);
      setDecision(res.data.decision);
      setStartTime(Date.now());
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load next adaptive question. Please try again.'
      );
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  useEffect(() => {
    loadNextAdaptiveQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam, patternParam]);

  const handleSubmit = async () => {
    if (!question || !selectedOption || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const res = await recordAttempt({
        questionId: question._id,
        selectedAnswer: selectedOption,
        timeTaken,
        source: 'adaptive',
      });

      setAttemptFeedback(res.data);
      setCompletedCount((prev) => prev + 1);

      // If completing under an orchestration prescription and reaching minimum items
      if (prescriptionId && completedCount + 1 >= 5) {
        completePrescription(prescriptionId).catch(() => null);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to record attempt. Please try submitting again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe standard QuestionDto projection for QuestionCard
  const standardQuestionProjection: QuestionDto | null = question
    ? {
        _id: question._id,
        topic: question.topic,
        pattern: question.pattern,
        difficulty: question.difficulty,
        question: question.question,
        options: question.options,
        answer: '',
        explanation: '',
      }
    : null;

  return (
    <div className={styles.pageContainer} data-testid="adaptive-practice-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Adaptive Practice Session
          </h1>
          <p className={styles.pageSubtitle}>
            Continuous Bayesian difficulty adjustment tailored to your real-time response history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Badge variant="info">Completed: {completedCount}</Badge>
          {decision && (
            <Badge variant="neutral">
              Difficulty: {decision.selectedDifficulty} / 5
            </Badge>
          )}
          {prescriptionId && <Badge variant="success">Prescribed Session</Badge>}
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {decision?.prerequisiteRedirect && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--status-warning-bg)',
            color: 'var(--status-warning)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
            border: '1px solid var(--border-subtle)',
          }}
          role="status"
        >
          <strong>Prerequisite Redirect:</strong> The adaptive engine redirected to foundational pattern{' '}
          <em>{decision.selectedPattern}</em> to solidify core prerequisite concepts.
        </div>
      )}

      {isLoadingQuestion ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="200px" borderRadius="var(--radius-lg)" />
          <Skeleton height="50px" borderRadius="var(--radius-md)" />
        </div>
      ) : standardQuestionProjection ? (
        <div>
          <QuestionCard
            mode="ADAPTIVE"
            question={standardQuestionProjection}
            selectedOption={selectedOption}
            onSelectOption={(opt) => !attemptFeedback && setSelectedOption(opt)}
            onSubmitAnswer={handleSubmit}
            isSubmitting={isSubmitting}
            feedback={
              attemptFeedback
                ? {
                    attempt: attemptFeedback,
                    explanation: 'Review the solution steps and formula takeaways below.',
                  }
                : null
            }
          />

          {attemptFeedback && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-4)',
                backgroundColor: attemptFeedback.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${attemptFeedback.isCorrect ? 'var(--status-success)' : 'var(--status-error)'}`,
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: attemptFeedback.isCorrect ? 'var(--status-success)' : 'var(--status-error)', marginBottom: 'var(--space-2)' }}>
                {attemptFeedback.isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {(attemptFeedback as unknown as { explanation?: string }).explanation || 'Review the solution steps and formula takeaways below.'}
              </div>
            </div>
          )}

          {!attemptFeedback ? (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
              <Button
                variant="secondary"
                onClick={() => navigate('/app/dashboard')}
              >
                Exit Session
              </Button>
            </div>
          ) : (

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="primary" onClick={loadNextAdaptiveQuestion}>
                Next Adaptive Question
              </Button>
              <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                Explain Solution
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/app/dashboard')}
              >
                Finish Session
              </Button>
            </div>
          )}

          {/* AI Hint System (available before or after attempt; Tier 5 requires attempt) */}
          {question && (
            <HintAccordion
              questionId={question._id}
              topic={question.topic}
              pattern={question.pattern}
              hasAttempted={Boolean(attemptFeedback)}
            />
          )}

          {/* Explanation Drawer */}
          <ExplanationDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            explanation={
              attemptFeedback?.isCorrect
                ? 'Your submitted answer is correct. Continue to the next question to reinforce the adaptive progression.'
                : 'Review the question conditions and formula takeaways above to remediate the underlying misconception.'
            }
          />
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No adaptive questions available</h2>
          <p>The question bank has no questions matching the current criteria.</p>
          <Button
            variant="primary"
            onClick={() => navigate('/app/practice')}
            style={{ marginTop: 'var(--space-3)' }}
          >
            Explore Practice Catalog
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdaptivePracticePage;
