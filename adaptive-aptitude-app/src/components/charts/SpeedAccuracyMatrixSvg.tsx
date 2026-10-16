// src/components/charts/SpeedAccuracyMatrixSvg.tsx
import React from 'react';
import type { SpeedAccuracyMatrixViewModel } from '../../types/analytics';
import styles from '../../styles/analytics.module.css';

export interface SpeedAccuracyMatrixSvgProps {
  quadrantCounts?: SpeedAccuracyMatrixViewModel | null;
}

export const SpeedAccuracyMatrixSvg: React.FC<SpeedAccuracyMatrixSvgProps> = ({
  quadrantCounts,
}) => {
  const counts = {
    accurateAndFast: quadrantCounts?.accurateAndFast ?? 0,
    accurateAndSlow: quadrantCounts?.accurateAndSlow ?? 0,
    fastErrorRushing: quadrantCounts?.fastErrorRushing ?? 0,
    slowErrorStruggling: quadrantCounts?.slowErrorStruggling ?? 0,
  };

  const hasEvidence =
    quadrantCounts !== null &&
    quadrantCounts !== undefined &&
    counts.accurateAndFast +
      counts.accurateAndSlow +
      counts.fastErrorRushing +
      counts.slowErrorStruggling >
      0;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Speed / Accuracy Matrix</h3>
      <p className={styles.chartSubtitle}>2×2 attempt distribution by response pacing and correctness</p>

      <div className={styles.svgWrapper}>
        <svg
          role="img"
          aria-labelledby="speed-acc-matrix-title speed-acc-matrix-desc"
          viewBox="0 0 360 260"
          width="100%"
          height="260"
          style={{ maxWidth: '400px' }}
        >
          <title id="speed-acc-matrix-title">Speed and Accuracy Quadrant Matrix</title>
          <desc id="speed-acc-matrix-desc">
            Visual breakdown of learner response patterns across fast/slow speed and accurate/inaccurate dimensions.
          </desc>

          {/* Quadrant 1: Accurate & Fast */}
          <rect
            x="10"
            y="10"
            width="165"
            height="115"
            rx="8"
            fill="rgba(16, 185, 129, 0.12)"
            stroke="var(--status-success)"
            strokeWidth="1.5"
          />
          <text x="20" y="35" fill="var(--text-primary)" fontSize="13" fontWeight="600">
            Accurate & Fast
          </text>
          <text
            x="20"
            y="85"
            fill="var(--status-success)"
            fontSize="28"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            {counts.accurateAndFast}
          </text>

          {/* Quadrant 2: Accurate & Slow */}
          <rect
            x="185"
            y="10"
            width="165"
            height="115"
            rx="8"
            fill="rgba(14, 165, 233, 0.12)"
            stroke="var(--status-info)"
            strokeWidth="1.5"
          />
          <text x="195" y="35" fill="var(--text-primary)" fontSize="13" fontWeight="600">
            Accurate & Slow
          </text>
          <text
            x="195"
            y="85"
            fill="var(--status-info)"
            fontSize="28"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            {counts.accurateAndSlow}
          </text>

          {/* Quadrant 3: Fast Error / Rushing */}
          <rect
            x="10"
            y="135"
            width="165"
            height="115"
            rx="8"
            fill="rgba(245, 158, 11, 0.12)"
            stroke="var(--status-warning)"
            strokeWidth="1.5"
          />
          <text x="20" y="160" fill="var(--text-primary)" fontSize="13" fontWeight="600">
            Fast Error / Rushing
          </text>
          <text
            x="20"
            y="210"
            fill="var(--status-warning)"
            fontSize="28"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            {counts.fastErrorRushing}
          </text>

          {/* Quadrant 4: Slow Error / Struggling */}
          <rect
            x="185"
            y="135"
            width="165"
            height="115"
            rx="8"
            fill="rgba(244, 63, 94, 0.12)"
            stroke="var(--status-error)"
            strokeWidth="1.5"
          />
          <text x="195" y="160" fill="var(--text-primary)" fontSize="13" fontWeight="600">
            Slow Error / Struggling
          </text>
          <text
            x="195"
            y="210"
            fill="var(--status-error)"
            fontSize="28"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            {counts.slowErrorStruggling}
          </text>
        </svg>
      </div>

      {!hasEvidence && (
        <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '8px' }}>
          Insufficient evidence available for cognitive speed-accuracy profile.
        </p>
      )}

      {/* Accessible Equivalent Table */}
      <table
        style={{
          width: '100%',
          marginTop: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          borderCollapse: 'collapse',
        }}
      >
        <caption className="sr-only">Speed and Accuracy Quadrant Counts Summary</caption>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
            <th style={{ padding: '4px 8px' }}>Quadrant</th>
            <th style={{ padding: '4px 8px', textAlign: 'right' }}>Attempts Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '4px 8px' }}>Accurate & Fast</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              {counts.accurateAndFast}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '4px 8px' }}>Accurate & Slow</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              {counts.accurateAndSlow}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '4px 8px' }}>Fast Error / Rushing</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              {counts.fastErrorRushing}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '4px 8px' }}>Slow Error / Struggling</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              {counts.slowErrorStruggling}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
