// src/pages/RegisterPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerLearner } from '../services/api/authApi';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ApiClientError } from '../services/api/apiClient';
import styles from '../styles/auth.module.css';

export const RegisterPage: React.FC = () => {
  const { status } = useAuth();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (status === 'AUTHENTICATED') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setCorrelationId(null);

    try {
      await registerLearner({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCorrelationId(err.correlationId);
        setErrorMessage(err.message || 'Registration failed.');
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Registration failed. Please check inputs.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={styles.authTitle}
          style={{ outline: 'none' }}
        >
          Create Account
        </h1>
        <p className={styles.authSubtitle}>
          Sign up to begin your individualized diagnostic and adaptive training
        </p>

        {successMessage && (
          <div
            role="status"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--status-success)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-success)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <ErrorAlert
            message={errorMessage}
            correlationId={correlationId}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="register-name" className={styles.formLabel}>
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-password" className={styles.formLabel}>
              Password
            </label>
            <input
              id="register-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={!name.trim() || !email.trim() || !password.trim() || isLoading}
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
          >
            Register Account
          </Button>
        </form>

        <div className={styles.authFooter}>
          Already registered?{' '}
          <Link to="/login" className={styles.authLink}>
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
