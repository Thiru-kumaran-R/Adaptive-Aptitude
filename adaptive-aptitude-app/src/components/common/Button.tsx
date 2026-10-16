// src/components/common/Button.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from '../../styles/controls.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const variantClass =
    variant === 'secondary'
      ? styles.buttonSecondary
      : variant === 'outline'
      ? styles.buttonOutline
      : variant === 'ghost'
      ? styles.buttonGhost
      : variant === 'danger'
      ? styles.buttonDanger
      : styles.buttonPrimary;

  const sizeClass =
    size === 'sm' ? styles.buttonSm : size === 'lg' ? styles.buttonLg : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${styles.button} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {isLoading && (
        <Loader2
          className="spinner"
          size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
};
