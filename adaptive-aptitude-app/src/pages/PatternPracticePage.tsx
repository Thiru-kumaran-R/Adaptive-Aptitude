// src/pages/PatternPracticePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchRandomQuestionsByPattern } from '../services/api/questionApi';
import { recordAttempt } from '../services/api/attemptApi';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { ExplanationDrawer } from '../components/quiz/ExplanationDrawer';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Button } from '../components/common/Button';
import type { QuestionDto, AttemptRecordDto } from '../types/api';
import type { QuizFeedbackViewModel } from '../types/quiz';
import styles from '../styles/pages.module.css';

export const PatternPracticePage: React.FC = () => {
  const { topic, pattern } = useParams<{ topic: string; pattern: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const decodedTopic = topic ? decodeURIComponent(topic) : '';
  const decodedPattern = pattern ? decodeURIComponent(pattern) : '';
  const limitParam = Number(searchParams.get('limit')) || 10;
  const prescriptionId = searchParams.get('prescriptionId') || undefined;

  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedbackViewModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [decodedPattern]);

  useEffect(() => {
    if (!decodedTopic || !decodedPattern) return;

    const loadQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchRandomQuestionsByPattern(decodedTopic, decodedPattern, {
          limit: limitParam,
        });
        setQuestions(res.data || []);
        setCurrentIndex(0);
        setSelectedOption(null);
        setFeedback(null);
        setStartTime(Date.now());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load practice questions.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [decodedTopic, decodedPattern, limitParam]);

  const currentQuestion = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedOption || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const res = await recordAttempt({
        questionId: currentQuestion._id,
        selectedAnswer: selectedOption,
        timeTaken: timeSpentSeconds,
        source: 'practice',
      });

      const attemptRecord = res.data;
      setFeedback({
        attempt: attemptRecord,
        explanation: currentQuestion.explanation || 'No detailed explanation provided for this question.',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
      setIsExplanationOpen(false);
      setStartTime(Date.now());
    }
  };

  return (
    <div className={styles.pageContainer} data-testid="pattern-practice-page">
      <div className={styles.pageHeader}>
        <div>
          <h1 ref={headingRef} tabIndex={-1} className={styles.pageTitle} style={{ outline: 'none' }}>
            Practice: {decodedPattern}
          </h1>
          <p className={styles.pageSubtitle}>
            Topic: {decodedTopic.replace(/_/g, ' ')} • Drill Mode
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <Skeleton height="350px" borderRadius="var(--radius-lg)" />
      ) : questions.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No practice questions available for this pattern</h2>
          <Button variant="secondary" onClick={() => navigate(`/app/practice/${encodeURIComponent(decodedTopic)}`)}>
            Return to Topic
          </Button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Question {currentIndex + 1} of {questions.length}
            </h2>

            {feedback && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExplanationOpen(true)}
              >
                View Explanation
              </Button>
            )}
          </div>

          <QuestionCard
            mode="PRACTICE"
            question={currentQuestion}
            selectedOption={selectedOption}
            onSelectOption={(opt) => !feedback && setSelectedOption(opt)}
            onSubmitAnswer={handleSubmitAnswer}
            isSubmitting={isSubmitting}
            feedback={feedback}
          />

          {feedback && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {currentIndex < questions.length - 1 ? (
                <Button variant="primary" onClick={handleNextQuestion}>
                  Next Question →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/app/practice/${encodeURIComponent(decodedTopic)}`)}
                >
                  Complete Drill Session
                </Button>
              )}
            </div>
          )}

          {feedback && (
            <ExplanationDrawer
              isOpen={isExplanationOpen}
              onClose={() => setIsExplanationOpen(false)}
              explanation={feedback.explanation}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PatternPracticePage;
