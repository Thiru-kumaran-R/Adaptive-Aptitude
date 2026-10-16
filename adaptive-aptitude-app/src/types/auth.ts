// src/types/auth.ts
import type { UserPrincipal, UserSessionSummary } from './api';

export type { UserPrincipal, UserSessionSummary } from './api';

export type AuthStatus =
  | 'BOOTSTRAPPING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'ACCOUNT_DISABLED'
  | 'SERVICE_UNAVAILABLE';

export interface AuthState {
  status: AuthStatus;
  user: UserPrincipal | null;
  session: UserSessionSummary | null;
  error?: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  revokeAll: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
}
