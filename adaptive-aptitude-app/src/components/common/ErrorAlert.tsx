// src/components/common/ErrorAlert.tsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from '../../styles/controls.module.css';

export interface ErrorAlertProps {
  id?: string;
  message: string;
  correlationId?: string | null;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  id,
  message,
  correlationId,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      id={id}
      role="alert"
      className={`${styles.errorAlert} ${className}`.trim()}
    >
      <AlertCircle
        size={20}
        style={{ color: 'var(--status-error)', flexShrink: 0, marginTop: '2px' }}
        aria-hidden="true"
      />
      <div style={{ flex: 1 }}>
        <div>{message}</div>
        {correlationId && (
          <div className={styles.errorCorrelation}>Ref: {correlationId}</div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className={styles.buttonGhost}
          style={{ padding: '2px', borderRadius: 'var(--radius-sm)' }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
