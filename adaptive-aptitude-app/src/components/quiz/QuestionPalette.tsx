// src/components/quiz/QuestionPalette.tsx
import React from 'react';
import styles from '../../styles/quiz.module.css';

export interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: number[];
  flaggedIndices: number[];
  onSelectIndex: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answeredIndices,
  flaggedIndices,
  onSelectIndex,
}) => {
  const answeredSet = new Set(answeredIndices);
  const flaggedSet = new Set(flaggedIndices);

  return (
    <div className={styles.paletteContainer} aria-label="Question Navigation Palette">
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
        Question Palette ({answeredIndices.length}/{totalQuestions} Answered)
      </h3>

      <div className={styles.paletteGrid}>
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredSet.has(i);
          const isFlagged = flaggedSet.has(i);

          let tileClass = styles.paletteTile;
          if (isCurrent) tileClass += ` ${styles.paletteTileCurrent}`;
          if (isAnswered) tileClass += ` ${styles.paletteTileAnswered}`;
          if (isFlagged) tileClass += ` ${styles.paletteTileFlagged}`;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectIndex(i)}
              className={tileClass}
              aria-label={`Question ${i + 1}${isCurrent ? ', current' : ''}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
