// src/components/quiz/ExplanationDrawer.tsx
import React from 'react';
import { renderSanitizedMarkdown } from '../../utils/markdownSanitizer';
import styles from '../../styles/quiz.module.css';

export interface ExplanationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: string;
  title?: string;
}

export const ExplanationDrawer: React.FC<ExplanationDrawerProps> = ({
  isOpen,
  onClose,
  explanation,
  title = 'Explanation & Concept Walkthrough',
}) => {
  if (!isOpen) return null;

  const sanitizedHtml = renderSanitizedMarkdown(explanation);

  return (
    <div
      className={styles.drawerBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className={styles.drawerContent}
        role="complementary"
        aria-label={title}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close explanation drawer"
            className={styles.paletteTile}
            style={{ width: 'auto', padding: '4px 10px' }}
          >
            ✕
          </button>
        </div>

        <div
          style={{ lineHeight: 1.7, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </aside>
    </div>
  );
};
