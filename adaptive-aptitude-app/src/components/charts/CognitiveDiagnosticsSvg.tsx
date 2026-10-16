// src/components/charts/CognitiveDiagnosticsSvg.tsx
import React from 'react';
import { SpeedAccuracyMatrixSvg } from './SpeedAccuracyMatrixSvg';
import type { CognitiveDiagnosticsViewModel } from '../../types/analytics';
import styles from '../../styles/analytics.module.css';

export interface CognitiveDiagnosticsSvgProps {
  data?: CognitiveDiagnosticsViewModel | null;
}

export const CognitiveDiagnosticsSvg: React.FC<CognitiveDiagnosticsSvgProps> = ({
  data,
}) => {
  if (!data) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Cognitive Diagnostics</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          No cognitive profile diagnostics data available.
        </p>
      </div>
    );
  }

  const { analysisWindow, speedAccuracyMatrix, staminaCurve, staminaReason } = data;

  const rushingScoreText =
    speedAccuracyMatrix?.rushingRiskScore !== undefined &&
    speedAccuracyMatrix?.rushingRiskScore !== null
      ? speedAccuracyMatrix.rushingRiskScore.toFixed(2)
      : 'Insufficient evidence';

  const medianCorrectText =
    speedAccuracyMatrix?.medianTimeCorrectSeconds !== undefined &&
    speedAccuracyMatrix?.medianTimeCorrectSeconds !== null
      ? `${speedAccuracyMatrix.medianTimeCorrectSeconds}s`
      : 'Insufficient evidence';

  const medianIncorrectText =
    speedAccuracyMatrix?.medianTimeIncorrectSeconds !== undefined &&
    speedAccuracyMatrix?.medianTimeIncorrectSeconds !== null
      ? `${speedAccuracyMatrix.medianTimeIncorrectSeconds}s`
      : 'Insufficient evidence';

  const baselineCount =
    speedAccuracyMatrix?.insufficientBaselineCount !== undefined &&
    speedAccuracyMatrix?.insufficientBaselineCount !== null
      ? speedAccuracyMatrix.insufficientBaselineCount
      : 0;

  // Stamina geometry
  const quartiles = staminaCurve?.quartileAccuracy ?? [];
  const hasStaminaCurve = Boolean(staminaCurve && quartiles.length > 0);

  // Map quartile 1-4 to x (50 to 350) and accuracy 0-100 to y (180 to 20)
  const getX = (q: number) => 50 + (q - 1) * 100;
  const getY = (acc: number) => 180 - (acc / 100) * 160;

  const pointsString = quartiles
    .map((item) => `${getX(item.quartile)},${getY(item.accuracy)}`)
    .join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Analysis Window & Pacing Metrics Summary */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Cognitive Analysis Window</h3>
        <p className={styles.chartSubtitle}>
          Scope: {analysisWindow?.windowDays ?? 30} days ({analysisWindow?.attemptsAnalyzed ?? 0} attempts analyzed)
        </p>

        <div className={styles.matrixGrid}>
          <div className={styles.matrixCell}>
            <div className={styles.matrixCount}>{rushingScoreText}</div>
            <div className={styles.matrixLabel}>Rushing Risk Score (0–1)</div>
          </div>
          <div className={styles.matrixCell}>
            <div className={styles.matrixCount}>{baselineCount}</div>
            <div className={styles.matrixLabel}>Insufficient Baseline Count</div>
          </div>
          <div className={styles.matrixCell}>
            <div className={styles.matrixCount}>{medianCorrectText}</div>
            <div className={styles.matrixLabel}>Median Time (Correct)</div>
          </div>
          <div className={styles.matrixCell}>
            <div className={styles.matrixCount}>{medianIncorrectText}</div>
            <div className={styles.matrixLabel}>Median Time (Incorrect)</div>
          </div>
        </div>
      </div>

      {/* 2x2 Speed Accuracy Matrix */}
      <SpeedAccuracyMatrixSvg quadrantCounts={speedAccuracyMatrix?.quadrantCounts} />

      {/* Stamina / Fatigue Profile */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Stamina & Fatigue Profile</h3>
        <p className={styles.chartSubtitle}>Accuracy progression across examination quartiles (1–4)</p>

        {hasStaminaCurve ? (
          <>
            <div className={styles.svgWrapper}>
              <svg
                role="img"
                aria-labelledby="stamina-curve-title stamina-curve-desc"
                viewBox="0 0 400 220"
                width="100%"
                height="220"
                style={{ maxWidth: '450px' }}
              >
                <title id="stamina-curve-title">Exam Stamina Quartile Curve</title>
                <desc id="stamina-curve-desc">
                  Line graph displaying accuracy percentage across quartiles 1, 2, 3, and 4 from completed mock exams.
                </desc>

                {/* Axes */}
                <line x1="40" y1="180" x2="360" y2="180" stroke="var(--border-strong)" strokeWidth="1.5" />
                <line x1="40" y1="20" x2="40" y2="180" stroke="var(--border-strong)" strokeWidth="1.5" />

                {/* Grid lines */}
                <line x1="40" y1="100" x2="360" y2="100" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <text x="32" y="104" fill="var(--text-tertiary)" fontSize="10" textAnchor="end">50%</text>
                <text x="32" y="24" fill="var(--text-tertiary)" fontSize="10" textAnchor="end">100%</text>
                <text x="32" y="184" fill="var(--text-tertiary)" fontSize="10" textAnchor="end">0%</text>

                {/* Quartile labels */}
                {[1, 2, 3, 4].map((q) => (
                  <text key={q} x={getX(q)} y="200" fill="var(--text-secondary)" fontSize="11" textAnchor="middle">
                    Q{q}
                  </text>
                ))}

                {/* Connecting Line */}
                <polyline
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                  points={pointsString}
                />

                {/* Points */}
                {quartiles.map((pt) => (
                  <g key={pt.quartile}>
                    <circle
                      cx={getX(pt.quartile)}
                      cy={getY(pt.accuracy)}
                      r="5"
                      fill="var(--accent-primary)"
                    />
                    <text
                      x={getX(pt.quartile)}
                      y={getY(pt.accuracy) - 10}
                      fill="var(--text-primary)"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                    >
                      {pt.accuracy}%
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span>Mocks Analyzed: {staminaCurve?.mockSessionsAnalyzed ?? 0}</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>Total Questions: {staminaCurve?.totalQuestionsAnalyzed ?? 0}</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>
                Fatigue Dropoff:{' '}
                {staminaCurve?.fatigueDropoffPercent !== null && staminaCurve?.fatigueDropoffPercent !== undefined
                  ? `${staminaCurve.fatigueDropoffPercent}%`
                  : staminaCurve?.fatigueReason || 'Unavailable'}
              </span>
            </div>

            {/* Equivalent Table */}
            <table
              style={{
                width: '100%',
                marginTop: 'var(--space-4)',
                fontSize: 'var(--text-xs)',
                borderCollapse: 'collapse',
              }}
            >
              <caption className="sr-only">Exam Quartile Stamina Accuracy Table</caption>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '4px 8px' }}>Quartile</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Accuracy</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Correct</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quartiles.map((q) => (
                  <tr key={q.quartile} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 8px' }}>Quartile {q.quartile}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {q.accuracy}%
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {q.correctQuestions}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {q.totalQuestions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            {staminaReason === 'insufficient_terminal_mocks'
              ? 'Insufficient completed mock examinations to evaluate stamina profile.'
              : staminaReason === 'insufficient_questions'
              ? 'Insufficient questions answered across full mock exams to establish stamina evidence.'
              : staminaReason || 'No eligible mock exam history available for stamina calculation.'}
          </div>
        )}
      </div>
    </div>
  );
};
