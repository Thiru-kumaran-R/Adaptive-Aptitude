// src/components/dashboard/ReadinessMeter.tsx
import React from 'react';
import styles from '../../styles/dashboard.module.css';

export interface ReadinessMeterProps {
  score?: number | null;
  status?: string | null;
  reason?: string | null;
}

export const ReadinessMeter: React.FC<ReadinessMeterProps> = ({
  score,
  status,
  reason,
}) => {
  const isAvailable = score !== undefined && score !== null;
  // Support both 0-1 index domain and 0-100 percentage domain
  const percentage = isAvailable
    ? score <= 1
      ? Math.round(score * 100)
      : Math.round(score)
    : 0;

  // Arc calculation for SVG circular gauge
  // radius = 70, circumference = 2 * PI * 70 ≈ 439.8
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isAvailable
    ? circumference - (percentage / 100) * circumference
    : circumference;

  let statusColor = 'var(--accent-primary)';
  if (percentage >= 80) statusColor = 'var(--status-success)';
  else if (percentage >= 60) statusColor = 'var(--status-warning)';
  else if (percentage > 0) statusColor = 'var(--status-error)';

  return (
    <div className={styles.readinessContainer} data-testid="readiness-meter">
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
        Exam Readiness
      </h3>

      <div className={styles.gaugeWrapper}>
        <svg
          role="img"
          aria-labelledby="readiness-meter-title readiness-meter-desc"
          viewBox="0 0 180 180"
          width="180"
          height="180"
        >
          <title id="readiness-meter-title">Readiness Assessment Radial Meter</title>
          <desc id="readiness-meter-desc">
            {isAvailable
              ? `Readiness score index: ${score.toFixed(2)} with status ${status || 'active'}`
              : 'Readiness evaluation unavailable due to insufficient evidence.'}
          </desc>

          {/* Background circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--bg-surface-elevated)"
            strokeWidth="14"
          />

          {/* Value Arc */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={isAvailable ? statusColor : 'var(--border-subtle)'}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>

        <div className={styles.gaugeValue}>
          {isAvailable ? (
            <>
              <span className="tabular-nums" data-testid="readiness-percentage">{percentage}%</span>
              <span className={styles.gaugeSubtext}>{status?.replace(/_/g, ' ') || 'On Track'}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-tertiary)' }}>N/A</span>
              <span className={styles.gaugeSubtext}>No Evidence</span>
            </>
          )}
        </div>
      </div>

      {reason && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '280px', marginTop: 'var(--space-2)' }}>
          {reason}
        </p>
      )}
    </div>
  );
};
