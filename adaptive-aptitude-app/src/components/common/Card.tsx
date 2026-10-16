// src/components/common/Card.tsx
import React from 'react';
import styles from '../../styles/controls.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  children,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`${styles.card} ${interactive ? styles.cardInteractive : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
};
