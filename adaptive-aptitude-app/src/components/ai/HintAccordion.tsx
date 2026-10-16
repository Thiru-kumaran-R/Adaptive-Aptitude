// src/components/ai/HintAccordion.tsx
import React, { useState } from 'react';
import { requestQuestionHint } from '../../services/api/learningApi';
import { renderSanitizedMarkdown } from '../../utils/markdownSanitizer';
import styles from '../../styles/tutor.module.css';

export interface HintAccordionProps {
  questionId: string;
  topic?: string;
  pattern?: string;
  hasAttempted?: boolean;
}

const HINT_TIERS = [
  { level: 1, label: 'Tier 1: Conceptual Orientation' },
  { level: 2, label: 'Tier 2: Methodological Strategy' },
  { level: 3, label: 'Tier 3: Mathematical Setup & Equation' },
  { level: 4, label: 'Tier 4: Step-by-Step Intermediate Calculation' },
  { level: 5, label: 'Tier 5: Complete Walkthrough & Solution' },
];

export const HintAccordion: React.FC<HintAccordionProps> = ({
  questionId,
  topic = 'Quantitative Aptitude',
  pattern,
  hasAttempted = false,
}) => {
  const [hints, setHints] = useState<Record<number, string>>({});
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null);
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHintForLevel = async (level: number) => {
    if (level === 5 && !hasAttempted) {
      setError('Tier 5 complete solution requires an initial submitted attempt.');
      return;
    }

    if (hints[level]) {
      setOpenLevel(openLevel === level ? null : level);
      return;
    }

    setLoadingLevel(level);
    setError(null);

    try {
      const response = await requestQuestionHint({
        questionId,
        hintLevel: level,
      });

      const hintText = response.data?.hint || 'Review the given conditions and check for proportional relationships.';
      setHints((prev) => ({ ...prev, [level]: hintText }));
      setOpenLevel(level);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve hint at this time. Please try again.'
      );
    } finally {
      setLoadingLevel(null);
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-4)' }} data-testid="hint-accordion">
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
        Progressive Socratic Hints
      </h3>

      {error && (
        <div style={{ padding: '8px', color: 'var(--status-error)', fontSize: 'var(--text-xs)', marginBottom: '8px' }}>
          {error}
        </div>
      )}

      <div className={styles.accordionList}>
        {HINT_TIERS.map((tier) => {
          const isOpen = openLevel === tier.level;
          const isLoading = loadingLevel === tier.level;
          const isLevel5Locked = tier.level === 5 && !hasAttempted;
          const hintContent = hints[tier.level];

          return (
            <div key={tier.level} className={styles.accordionItem}>
              <button
                type="button"
                onClick={() => fetchHintForLevel(tier.level)}
                disabled={isLoading || isLevel5Locked}
                className={styles.accordionHeader}
                aria-expanded={isOpen}
              >
                <span>{tier.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {isLevel5Locked
                    ? '(Attempt Required)'
                    : isLoading
                    ? 'Loading...'
                    : isOpen
                    ? 'Hide'
                    : 'Reveal'}
                </span>
              </button>

              {isOpen && hintContent && (
                <div
                  className={styles.accordionContent}
                  dangerouslySetInnerHTML={{
                    __html: renderSanitizedMarkdown(hintContent),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
