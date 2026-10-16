// src/components/charts/RetentionEvidenceSvg.tsx
import React from 'react';
import type { RetentionEvidenceViewModel } from '../../types/analytics';
import styles from '../../styles/analytics.module.css';

export interface RetentionEvidenceSvgProps {
  data?: RetentionEvidenceViewModel | null;
}

export const RetentionEvidenceSvg: React.FC<RetentionEvidenceSvgProps> = ({ data }) => {
  if (!data) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Observed Retention Evidence</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          No spaced retention evidence data available.
        </p>
      </div>
    );
  }

  const { currentState, observedRetentionByGap = [], evidence } = data;
  const stageDist = currentState?.stageDistribution;

  const stages = [
    { label: 'Stage 0 (1d)', count: stageDist?.stage0_1day ?? 0 },
    { label: 'Stage 1 (3d)', count: stageDist?.stage1_3days ?? 0 },
    { label: 'Stage 2 (7d)', count: stageDist?.stage2_7days ?? 0 },
    { label: 'Stage 3 (14d)', count: stageDist?.stage3_14days ?? 0 },
    { label: 'Stage 4 (30d)', count: stageDist?.stage4_30days ?? 0 },
  ];

  const maxStageCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Revision Stage Distribution */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Spaced Revision Stage Distribution</h3>
        <p className={styles.chartSubtitle}>
          Active items categorized across 5 deterministic interval stages
        </p>

        <div className={styles.svgWrapper}>
          <svg
            role="img"
            aria-labelledby="stage-dist-title stage-dist-desc"
            viewBox="0 0 400 200"
            width="100%"
            height="200"
            style={{ maxWidth: '450px' }}
          >
            <title id="stage-dist-title">Revision Stages Distribution</title>
            <desc id="stage-dist-desc">
              Bar chart displaying the count of patterns currently sitting in each of the 5 fixed revision stages.
            </desc>

            {stages.map((st, i) => {
              const barHeight = (st.count / maxStageCount) * 120;
              const x = 30 + i * 75;
              const y = 150 - barHeight;
              return (
                <g key={st.label}>
                  <rect
                    x={x}
                    y={y}
                    width="45"
                    height={Math.max(barHeight, 2)}
                    rx="4"
                    fill="var(--accent-primary)"
                  />
                  <text
                    x={x + 22}
                    y={y - 6}
                    fill="var(--text-primary)"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {st.count}
                  </text>
                  <text
                    x={x + 22}
                    y="172"
                    fill="var(--text-secondary)"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {st.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--space-2)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <span>Active: {currentState?.activeRevisionItems ?? 0}</span>
          <span>Completed: {currentState?.completedRevisionItems ?? 0}</span>
          <span>Due Today: {currentState?.dueTodayCount ?? 0}</span>
          <span>Overdue: {currentState?.overdueCount ?? 0}</span>
        </div>

        <table
          style={{
            width: '100%',
            marginTop: 'var(--space-4)',
            fontSize: 'var(--text-xs)',
            borderCollapse: 'collapse',
          }}
        >
          <caption className="sr-only">Revision Stage Distribution Table</caption>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>Stage</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Items Count</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((st) => (
              <tr key={st.label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '4px 8px' }}>{st.label}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {st.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. Observed Retention By Gap */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Observed Retention Rate by Time Gap</h3>
        <p className={styles.chartSubtitle}>
          Real retention performance across recorded elapsed practice intervals
        </p>

        {observedRetentionByGap.length > 0 ? (
          <>
            <div className={styles.svgWrapper}>
              <svg
                role="img"
                aria-labelledby="retention-gap-title retention-gap-desc"
                viewBox="0 0 420 200"
                width="100%"
                height="200"
                style={{ maxWidth: '450px' }}
              >
                <title id="retention-gap-title">Observed Retention by Gap</title>
                <desc id="retention-gap-desc">
                  Bar chart showing observed retention accuracy rate across different elapsed time gap buckets.
                </desc>

                {observedRetentionByGap.map((item, i) => {
                  const barHeight = (item.observedRetentionRate / 100) * 120;
                  const x = 20 + i * 65;
                  const y = 150 - barHeight;
                  return (
                    <g key={item.gapBucket}>
                      <rect
                        x={x}
                        y={y}
                        width="42"
                        height={Math.max(barHeight, 2)}
                        rx="4"
                        fill="var(--status-info)"
                      />
                      <text
                        x={x + 21}
                        y={y - 6}
                        fill="var(--text-primary)"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                      >
                        {item.observedRetentionRate}%
                      </text>
                      <text
                        x={x + 21}
                        y="170"
                        fill="var(--text-secondary)"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {item.gapBucket}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <table
              style={{
                width: '100%',
                marginTop: 'var(--space-4)',
                fontSize: 'var(--text-xs)',
                borderCollapse: 'collapse',
              }}
            >
              <caption className="sr-only">Observed Retention Rates by Time Gap</caption>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '4px 8px' }}>Gap Interval</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Retention Rate</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Correct Events</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total Events</th>
                </tr>
              </thead>
              <tbody>
                {observedRetentionByGap.map((item) => (
                  <tr key={item.gapBucket} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 8px' }}>{item.gapBucket}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {item.observedRetentionRate}%
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {item.correctEvents}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {item.totalEvents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>
            No observed retention evidence recorded yet across interval gaps.
          </p>
        )}

        {evidence && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 'var(--space-2)',
            }}
          >
            <span>Analyzed Attempts: {evidence.revisionAttemptsAnalyzed ?? 0}</span>
            <span style={{ margin: '0 6px' }}>•</span>
            <span>Excluded (No Prior): {evidence.excludedNoPriorAttemptCount ?? 0}</span>
            <span style={{ margin: '0 6px' }}>•</span>
            <span>Excluded (Short Gap): {evidence.excludedShortGapCount ?? 0}</span>
            <span style={{ margin: '0 6px' }}>•</span>
            <span>Excluded (Invalid Chronology): {evidence.excludedInvalidChronologyCount ?? 0}</span>
          </div>
        )}
      </div>
    </div>
  );
};
