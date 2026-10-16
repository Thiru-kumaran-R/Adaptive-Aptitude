// src/pages/ProfileSettingsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile } from '../services/api/goalApi';
import { revokeAllSessions } from '../services/api/authApi';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import type { UserProfileDto } from '../types/api';
import styles from '../styles/pages.module.css';

export const ProfileSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetchUserProfile(user.userId);
        setProfile(res.data);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to retrieve learner profile details.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.userId]);

  const handleRevokeAll = async () => {
    setIsRevoking(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await revokeAllSessions();
      setIsConfirmModalOpen(false);
      setSuccessMessage('All active sessions have been revoked. Logging out...');
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to revoke active sessions.'
      );
      setIsRevoking(false);
    }
  };

  return (
    <div className={styles.pageContainer} data-testid="profile-settings-page">
      <div className={styles.pageHeader}>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={styles.pageTitle}
            style={{ outline: 'none' }}
          >
            Learner Profile & Security Settings
          </h1>
          <p className={styles.pageSubtitle}>
            Account information, cryptographic credentials, and active session controls.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {successMessage && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
            border: '1px solid var(--border-subtle)',
          }}
          role="status"
        >
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="180px" borderRadius="var(--radius-lg)" />
          <Skeleton height="150px" borderRadius="var(--radius-lg)" />
        </div>
      ) : profile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Identity & Account Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                Learner Credentials
              </h2>
              <Badge variant={profile.status === 'active' ? 'success' : 'warning'}>
                {profile.status ? profile.status.toUpperCase() : 'ACTIVE'}
              </Badge>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 'var(--text-xs)' }}>
                  Learner Name
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{profile.name}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 'var(--text-xs)' }}>
                  Email Address
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{profile.email}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 'var(--text-xs)' }}>
                  User ID
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                  {profile.userId}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 'var(--text-xs)' }}>
                  Platform Role
                </span>
                <span style={{ textTransform: 'capitalize' }}>
                  Learner
                </span>
              </div>
            </div>
          </div>

          {/* Session & Security Controls Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Session & Access Security
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Access tokens are stored strictly in memory closure. Refresh tokens are secured via SameSite=Strict HttpOnly cookies.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                onClick={logout}
              >
                Sign Out of Current Device
              </Button>

              <Button
                variant="danger"
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Revoke All Active Sessions
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No profile record found.</p>
        </div>
      )}

      {/* Revoke All Sessions Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isRevoking && setIsConfirmModalOpen(false)}
        title="Revoke All Sessions"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--status-error)', lineHeight: 1.6 }}>
            Are you sure you want to invalidate all active refresh tokens? This will sign you out of all devices and active browser windows immediately.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRevokeAll}
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking Sessions...' : 'Confirm Revoke All'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileSettingsPage;
