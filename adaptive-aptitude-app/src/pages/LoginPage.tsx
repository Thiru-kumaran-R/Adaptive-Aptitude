// src/pages/LoginPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ApiClientError } from '../services/api/apiClient';
import styles from '../styles/auth.module.css';

export const LoginPage: React.FC = () => {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (status === 'AUTHENTICATED') {
    const returnUrl = searchParams.get('returnUrl');
    return <Navigate to={returnUrl ? decodeURIComponent(returnUrl) : '/app/dashboard'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setCorrelationId(null);

    try {
      await login(email.trim(), password);
      const returnUrl = searchParams.get('returnUrl');
      navigate(returnUrl ? decodeURIComponent(returnUrl) : '/app/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCorrelationId(err.correlationId);
        setErrorMessage(err.message || 'Invalid email or password.');
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Login failed. Please check credentials.'
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
          Sign In to Your Account
        </h1>
        <p className={styles.authSubtitle}>
          Enter your learner credentials to access your adaptive study plan
        </p>

        {errorMessage && (
          <ErrorAlert
            message={errorMessage}
            correlationId={correlationId}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="login-email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className={styles.formLabel}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
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
            disabled={!email.trim() || !password.trim() || isLoading}
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
          >
            Sign In
          </Button>
        </form>

        <div className={styles.authFooter}>
          Don't have an account yet?{' '}
          <Link to="/register" className={styles.authLink}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
