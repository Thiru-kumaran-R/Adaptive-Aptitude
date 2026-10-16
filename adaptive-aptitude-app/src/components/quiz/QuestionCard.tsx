// src/components/quiz/QuestionCard.tsx
import React from 'react';
import type { QuestionCardProps } from '../../types/quiz';
import styles from '../../styles/quiz.module.css';

export const QuestionCard: React.FC<QuestionCardProps> = (props) => {
  const { mode, question } = props;

  const isMockExam = mode === 'MOCK_EXAM';
  const isMockReview = mode === 'MOCK_REVIEW';

  // For active mock exam, answer/explanation MUST NOT be accessed
  const selectedOption = !isMockReview ? props.selectedOption : undefined;
  const onSelectOption = !isMockReview ? props.onSelectOption : undefined;
  const isFlagged = props.isFlagged ?? false;

  // Feedback for practice modes
  const feedback = !isMockExam && !isMockReview ? props.feedback : null;
  const isSubmitting = !isMockReview ? props.isSubmitting ?? false : false;

  // In Mock Review mode, the question is MockReviewQuestionDto
  // which may have studentAnswer, isCorrect, explanation, etc.
  const reviewData = isMockReview
    ? (question as unknown as {
        userAnswer?: string | null;
        selectedOption?: string | null;
        correctAnswer?: string;
        answer?: string;
        isCorrect?: boolean;
        explanation?: string;
      })
    : null;

  // A11Y-01 Keyboard Navigation Contract (Section 46.1)
  React.useEffect(() => {
    if (isMockReview || isSubmitting || !onSelectOption || !question.options) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isEditable =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (isEditable) return;

      const key = e.key.toUpperCase();
      let targetIdx = -1;
      if (key === '1' || key === 'A') targetIdx = 0;
      else if (key === '2' || key === 'B') targetIdx = 1;
      else if (key === '3' || key === 'C') targetIdx = 2;
      else if (key === '4' || key === 'D') targetIdx = 3;

      if (targetIdx >= 0 && targetIdx < question.options.length) {
        e.preventDefault();
        onSelectOption(question.options[targetIdx]);
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const currentIdx = selectedOption ? question.options.indexOf(selectedOption) : -1;
        const nextIdx = (currentIdx + 1) % question.options.length;
        e.preventDefault();
        onSelectOption(question.options[nextIdx]);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const currentIdx = selectedOption ? question.options.indexOf(selectedOption) : 0;
        const prevIdx = (currentIdx - 1 + question.options.length) % question.options.length;
        e.preventDefault();
        onSelectOption(question.options[prevIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMockReview, isSubmitting, onSelectOption, question.options, selectedOption]);

  return (
    <div
      className={styles.questionCard}
      data-testid="question-card"
      data-mode={mode}
    >
      <div className={styles.questionMeta}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {'topic' in question && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {question.topic}
            </span>
          )}
          {'pattern' in question && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
              }}
            >
              • {question.pattern}
            </span>
          )}
          {'difficulty' in question && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
              }}
            >
              (Diff: {question.difficulty}/10)
            </span>
          )}
        </div>

        {isMockExam && props.onFlagForReview && (
          <button
            type="button"
            onClick={props.onFlagForReview}
            className={`${styles.paletteTile} ${isFlagged ? styles.paletteTileFlagged : ''}`}
            style={{ width: 'auto', padding: '4px 12px', fontSize: 'var(--text-xs)' }}
          >
            {isFlagged ? 'Flagged for Review' : 'Flag Question'}
          </button>
        )}
      </div>

      <div className={styles.questionText}>{question.question}</div>

      <div className={styles.optionsList} role="radiogroup" aria-label="Question answer options">
        {question.options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedOption === option;

          let optionStyle = styles.optionItem;
          if (isSelected) {
            optionStyle += ` ${styles.optionSelected}`;
          }

          if (isMockReview && reviewData) {
            const correctOpt = reviewData.correctAnswer || reviewData.answer;
            const chosenOpt = reviewData.userAnswer || reviewData.selectedOption;
            if (option === correctOpt) {
              optionStyle += ` ${styles.optionCorrect}`;
            } else if (option === chosenOpt && !reviewData.isCorrect) {
              optionStyle += ` ${styles.optionIncorrect}`;
            }
          } else if (feedback?.attempt) {
            if (option === feedback.attempt.selectedAnswer) {
              optionStyle += feedback.attempt.isCorrect
                ? ` ${styles.optionCorrect}`
                : ` ${styles.optionIncorrect}`;
            }
          }

          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isMockReview || isSubmitting}
              onClick={() => onSelectOption && onSelectOption(option)}
              className={optionStyle}
            >
              <span className={styles.optionLabel}>{letter}</span>
              <span className={styles.optionText}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Practice Mode Actions */}
      {!isMockExam && !isMockReview && (
        <div className={styles.quizActions}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {props.onRequestHint && (
              <button
                type="button"
                onClick={props.onRequestHint}
                className={styles.optionItem}
                style={{ width: 'auto', padding: '6px 14px', fontSize: 'var(--text-xs)' }}
              >
                Need a Hint?
              </button>
            )}
            {props.onDiagnoseError && feedback?.attempt && !feedback.attempt.isCorrect && (
              <button
                type="button"
                onClick={props.onDiagnoseError}
                className={styles.optionItem}
                style={{ width: 'auto', padding: '6px 14px', fontSize: 'var(--text-xs)' }}
              >
                Explain My Mistake
              </button>
            )}
          </div>

          {props.onSubmitAnswer && !feedback && (
            <button
              type="button"
              disabled={!selectedOption || isSubmitting}
              onClick={props.onSubmitAnswer}
              className={`${styles.paletteTile} ${styles.paletteTileAnswered}`}
              style={{
                width: 'auto',
                padding: '8px 20px',
                fontSize: 'var(--text-sm)',
                cursor: selectedOption ? 'pointer' : 'not-allowed',
                opacity: selectedOption ? 1 : 0.6,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
