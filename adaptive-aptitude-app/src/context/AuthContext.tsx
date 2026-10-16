// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  executeSingleFlightRefresh,
} from '../services/api/tokenManager';
import {
  loginLearner,
  logoutLearner,
  revokeAllSessions,
  fetchAuthMe,
} from '../services/api/authApi';
import type {
  AuthStatus,
  AuthContextValue,
  UserPrincipal,
  UserSessionSummary,
} from '../types/auth';
import styles from '../styles/auth.module.css';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('BOOTSTRAPPING');
  const [user, setUser] = useState<UserPrincipal | null>(null);
  const [session, setSession] = useState<UserSessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const runBootstrap = async () => {
    setStatus('BOOTSTRAPPING');
    setError(null);
    try {
      await executeSingleFlightRefresh();
      const meRes = await fetchAuthMe();
      setUser(meRes.data.user);
      setSession(meRes.data.session);
      setStatus('AUTHENTICATED');
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : err instanceof Error
          ? err.message
          : '';
      const statusCode =
        err && typeof err === 'object' && 'statusCode' in err
          ? Number((err as { statusCode: number }).statusCode)
          : undefined;

      if (code === 'ACCOUNT_DISABLED') {
        clearAccessToken();
        queryClient.clear();
        setStatus('ACCOUNT_DISABLED');
        setError('ACCOUNT_DISABLED');
      } else if (
        code === 'REFRESH_ORIGIN_REQUIRED' ||
        code === 'CORS_ORIGIN_DENIED' ||
        code === 'NETWORK_ERROR' ||
        (statusCode !== undefined && statusCode >= 500)
      ) {
        setStatus('SERVICE_UNAVAILABLE');
        setError(code || 'SERVICE_UNAVAILABLE');
      } else {
        clearAccessToken();
        queryClient.clear();
        setStatus('UNAUTHENTICATED');
      }
    }
  };

  useEffect(() => {
    runBootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await loginLearner({ email, password });
    setAccessToken(res.data.accessToken);
    queryClient.clear();
    const meRes = await fetchAuthMe();
    setUser(meRes.data.user);
    setSession(meRes.data.session);
    setStatus('AUTHENTICATED');
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutLearner();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAccessToken();
      queryClient.clear();
      setUser(null);
      setSession(null);
      setStatus('UNAUTHENTICATED');
    }
  };

  const revokeAll = async (): Promise<void> => {
    try {
      await revokeAllSessions();
    } catch {
      // Ignore network errors on revokeAll
    } finally {
      clearAccessToken();
      queryClient.clear();
      setUser(null);
      setSession(null);
      setStatus('UNAUTHENTICATED');
    }
  };

  const retryBootstrap = async (): Promise<void> => {
    await runBootstrap();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      session,
      error,
      login,
      logout,
      revokeAll,
      retryBootstrap,
    }),
    [status, user, session, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AccountDisabledView() {
  return (
    <div data-testid="account-disabled-view" className={styles.terminalView}>
      <h1 className={styles.authTitle}>Account Deactivated</h1>
      <p className={styles.authSubtitle}>
        Your account has been deactivated. Please contact your academic administrator or support team.
      </p>
    </div>
  );
}

export function AuthUnavailableView({ onRetry }: { onRetry?: () => void }) {
  return (
    <div data-testid="service-unavailable-view" className={styles.terminalView}>
      <h1 className={styles.authTitle}>Service Unavailable</h1>
      <p className={styles.authSubtitle}>
        Unable to communicate with the authentication service. Please verify your connection and try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`${styles.formInput} ${styles.authLink}`}
          style={{ cursor: 'pointer', marginTop: '1rem' }}
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}

export function AuthBootstrapBoundary({ children }: { children?: React.ReactNode }) {
  const { status, retryBootstrap } = useAuth();
  const location = useLocation();

  if (status === 'BOOTSTRAPPING') {
    return (
      <div data-testid="auth-loading" className={styles.terminalView}>
        <h1 className={styles.authTitle}>Initializing Learner Workspace...</h1>
      </div>
    );
  }

  if (status === 'ACCOUNT_DISABLED') {
    return <AccountDisabledView />;
  }

  if (status === 'SERVICE_UNAVAILABLE') {
    return <AuthUnavailableView onRetry={retryBootstrap} />;
  }

  if (status === 'UNAUTHENTICATED') {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return <>{children || <Outlet />}</>;
}

export { AuthContext };
