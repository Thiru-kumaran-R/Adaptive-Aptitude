// src/components/layout/AppHeader.tsx
import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/layout.module.css';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.headerBrand}>
        <span>Adaptive Aptitude</span>
      </div>

      <div className={styles.headerActions}>
        <button
          type="button"
          onClick={() => { window.location.href = '/app/profile'; }}
          aria-label="Account Settings"
          className={styles.userMenu}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit' }}
        >
          <User size={18} aria-hidden="true" />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            {user?.name || 'Learner'}
          </span>
        </button>

        <button
          type="button"
          onClick={logout}
          aria-label="Log out of application"
          className={styles.navItem}
          style={{ cursor: 'pointer', border: 'none', background: 'none' }}
        >
          <LogOut size={16} aria-hidden="true" />
          <span style={{ fontSize: 'var(--text-xs)' }}>Logout</span>
        </button>
      </div>
    </header>
  );
};
