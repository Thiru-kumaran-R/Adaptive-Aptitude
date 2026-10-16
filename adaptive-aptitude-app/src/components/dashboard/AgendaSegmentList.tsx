// src/components/dashboard/AgendaSegmentList.tsx
import React from 'react';
import { ArrowRight, Clock, Target } from 'lucide-react';
import type { AgendaSegmentDto, PublicActionDto } from '../../types/api';
import styles from '../../styles/dashboard.module.css';

export interface AgendaSegmentListProps {
  segments?: AgendaSegmentDto[] | null;
  onSelectActivity: (activity: PublicActionDto) => void;
  startingActionId?: string | null;
}

export const AgendaSegmentList: React.FC<AgendaSegmentListProps> = ({
  segments,
  onSelectActivity,
  startingActionId,
}) => {
  if (!segments || segments.length === 0) {
    return (
      <div className={styles.agendaContainer}>
        <h3 className={styles.heroTitle}>Daily Agenda</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          No agenda segments scheduled for today. Complete your diagnostic or practice from the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.agendaContainer} data-testid="agenda-segment-list">
      <div className={styles.agendaHeader}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Prescribed Daily Agenda (4 Segments)
        </h3>
      </div>

      <div className={styles.segmentList}>
        {segments.map((segment) => (
          <div
            key={segment.segmentIndex}
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--bg-surface-elevated)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                Segment {segment.segmentIndex + 1}: {segment.segmentName}
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Allocated: {segment.allocatedQuestions} questions
              </span>
            </div>

            {segment.activities && segment.activities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {segment.activities.map((act) => {
                  const isStarting = startingActionId === act.actionId;
                  return (
                    <div key={act.actionId} className={styles.segmentItem}>
                      <div className={styles.segmentInfo}>
                        <Target size={16} color="var(--accent-primary)" aria-hidden="true" />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                            {act.topic} — {act.pattern}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {act.rationale || act.executionIntent || act.actionType.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {act.estimatedMinutes && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            <Clock size={12} aria-hidden="true" />
                            <span>{act.estimatedMinutes}m</span>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isStarting}
                          onClick={() => onSelectActivity(act)}
                          className={styles.buttonGhost}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 600,
                            color: 'var(--accent-primary)',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <span>{isStarting ? 'Starting...' : 'Start'}</span>
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No activities pending in this segment.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
