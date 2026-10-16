// src/components/common/Badge.tsx
import React from 'react';
import styles from '../../styles/controls.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  ...rest
}) => {
  const variantClass =
    variant === 'success'
      ? styles.badgeSuccess
      : variant === 'warning'
      ? styles.badgeWarning
      : variant === 'error'
      ? styles.badgeError
      : variant === 'info'
      ? styles.badgeInfo
      : styles.badgeNeutral;

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
};
