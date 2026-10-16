// src/pages/LandingPage.tsx
import React, { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/auth.module.css';

export const LandingPage: React.FC = () => {
  const { status } = useAuth();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (status === 'AUTHENTICATED') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className={styles.authContainer} style={{ flexDirection: 'column', minHeight: '100vh' }}>
      <header
        style={{
          width: '100%',
          maxWidth: '1200px',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
          Adaptive Aptitude
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/login"
            className={`${styles.formInput} ${styles.authLink}`}
            style={{ padding: '0.5rem 1rem', display: 'inline-block' }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
            }}
          >
            Create Account
          </Link>
        </div>
      </header>

      <main className={styles.landingHero}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={styles.heroHeadline}
          style={{ outline: 'none' }}
        >
          Master Quantitative Reasoning with Precision
        </h1>
        <p className={styles.heroLead}>
          Advanced cognitive analytics, deterministic spaced repetition, and real-time adaptive diagnostic engines designed for engineering examination success.
        </p>

        <div className={styles.ctaGroup}>
          <Link
            to="/register"
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 'var(--text-base)',
            }}
          >
            Create Account
          </Link>
          <Link
            to="/login"
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 'var(--text-base)',
            }}
          >
            Sign In to Account
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
