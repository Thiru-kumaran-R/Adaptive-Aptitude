// src/test/api/authApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  registerLearner,
  loginLearner,
  refreshSession,
  logoutLearner,
  revokeAllSessions,
  fetchAuthMe,
} from '../../services/api/authApi';

describe('Auth API Contract (Operations 1–6)', () => {
  it('Operation 1: POST /api/v1/auth/register', async () => {
    const res = await registerLearner({
      name: 'Test Student',
      email: 'student@example.com',
      password: 'SecurePassword123!',
    });
    expect(res.success).toBe(true);
    expect(res.data.user.email).toBe('student@example.com');
  });

  it('Operation 2: POST /api/v1/auth/login', async () => {
    const res = await loginLearner({
      email: 'learner@example.com',
      password: 'ValidPassword123!',
    });
    expect(res.success).toBe(true);
    expect(res.data.accessToken).toBeDefined();
    expect(res.data.user.email).toBe('learner@example.com');
  });

  it('Operation 3: POST /api/v1/auth/refresh', async () => {
    const res = await refreshSession();
    expect(res.success).toBe(true);
    expect(res.data.accessToken).toBeDefined();
  });

  it('Operation 4: POST /api/v1/auth/logout', async () => {
    const res = await logoutLearner();
    expect(res.success).toBe(true);
    expect(res.data.message).toBeDefined();
  });

  it('Operation 5: POST /api/v1/auth/revoke-all', async () => {
    const res = await revokeAllSessions();
    expect(res.success).toBe(true);
    expect(res.data.message).toBeDefined();
  });


  it('Operation 6: GET /api/v1/auth/me', async () => {
    const res = await fetchAuthMe();
    expect(res.success).toBe(true);
    expect(res.data.user.userId).toBe('user-test-123');
    expect(res.data.session).toBeDefined();
  });
});
