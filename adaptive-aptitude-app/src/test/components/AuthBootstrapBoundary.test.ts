// src/test/components/AuthBootstrapBoundary.test.ts
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  AuthContext,
  AuthBootstrapBoundary,
  AccountDisabledView,
  AuthUnavailableView,
} from '../../context/AuthContext';

describe('AuthBootstrapBoundary (5-State Machine Rendering)', () => {
  it('renders loading skeleton during BOOTSTRAPPING state', () => {
    const mockValue = {
      status: 'BOOTSTRAPPING' as const,
      user: null,
      session: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      revokeAll: vi.fn(),
      retryBootstrap: vi.fn(),
    };

    render(
      React.createElement(
        AuthContext.Provider,
        { value: mockValue },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(
            AuthBootstrapBoundary,
            null,
            React.createElement('div', null, 'Protected Content')
          )
        )
      )
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders protected children during AUTHENTICATED state', () => {
    const mockValue = {
      status: 'AUTHENTICATED' as const,
      user: { userId: 'user-123', name: 'Learner', email: 'l@e.com', status: 'active' as const },
      session: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      revokeAll: vi.fn(),
      retryBootstrap: vi.fn(),
    };

    render(
      React.createElement(
        AuthContext.Provider,
        { value: mockValue },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(
            AuthBootstrapBoundary,
            null,
            React.createElement('div', null, 'Protected Content')
          )
        )
      )
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders AccountDisabledView when account is deactivated', () => {
    render(React.createElement(AccountDisabledView));
    expect(screen.getByText(/Account Deactivated/i)).toBeInTheDocument();
  });

  it('renders AuthUnavailableView with retry button when service is unavailable', () => {
    const handleRetry = vi.fn();
    render(React.createElement(AuthUnavailableView, { onRetry: handleRetry }));
    expect(screen.getByText(/Service Unavailable/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Retry Connection/i });
    expect(btn).toBeInTheDocument();

    // Zero automatic retries occur on mount
    expect(handleRetry).toHaveBeenCalledTimes(0);

    // Only manual user click triggers retry
    btn.click();
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
