// src/test/integration/tutorRateLimit.test.ts
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { TutorChatWindow } from '../../components/ai/TutorChatWindow';
import * as learningApi from '../../services/api/learningApi';

describe('Tutor Rate Limit Handling (ACC-13: 429 & Cooldown)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ACC-13: Retry-After: 30 -> 30-second-derived countdown, disables submit, ticks down, 0 auto retries', async () => {
    const tutorSpy = vi.spyOn(learningApi, 'requestTutorGuidance');

    render(
      React.createElement(TutorChatWindow, {
        topic: 'Arithmetic',
        pattern: 'Percentages',
      })
    );

    const input = screen.getByRole('textbox', { name: /Ask a question or explain your reasoning/i });
    const sendBtn = screen.getByRole('button', { name: /Send Message/i });

    // Type trigger for simulated 429 with Retry-After: 30
    fireEvent.change(input, { target: { value: 'simulate_rate_limit' } });
    fireEvent.click(sendBtn);

    // Verify rate limit notice appears with 30s countdown
    await waitFor(() => {
      expect(screen.getByText(/Rate limited. Please wait 30s/i)).toBeInTheDocument();
    });

    // Send button must show wait countdown and be disabled
    expect(sendBtn).toHaveTextContent(/Wait \(30s\)/i);
    expect(sendBtn).toBeDisabled();

    // Invariant: Automatic retries count = 0 (only the 1 manual submission was sent)
    expect(tutorSpy).toHaveBeenCalledTimes(1);

    // Advance 5 seconds -> countdown ticks down to 25s
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/Rate limited. Please wait 25s/i)).toBeInTheDocument();
    expect(sendBtn).toHaveTextContent(/Wait \(25s\)/i);

    // Invariant: still 0 auto retries after time passes
    expect(tutorSpy).toHaveBeenCalledTimes(1);
  });

  it('ACC-13: Retry-After: 10 -> 10-second-derived countdown (not arbitrary 10s default)', async () => {
    render(
      React.createElement(TutorChatWindow, {
        topic: 'Arithmetic',
        pattern: 'Percentages',
      })
    );

    const input = screen.getByRole('textbox', { name: /Ask a question or explain your reasoning/i });
    const sendBtn = screen.getByRole('button', { name: /Send Message/i });

    fireEvent.change(input, { target: { value: 'simulate_rate_limit_10' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Rate limited. Please wait 10s/i)).toBeInTheDocument();
    });

    expect(sendBtn).toHaveTextContent(/Wait \(10s\)/i);
    expect(sendBtn).toBeDisabled();
  });

  it('ACC-13: missing Retry-After -> NO fabricated countdown, displays frozen busy message and manual Try Again CTA', async () => {
    render(
      React.createElement(TutorChatWindow, {
        topic: 'Arithmetic',
        pattern: 'Percentages',
      })
    );

    const input = screen.getByRole('textbox', { name: /Ask a question or explain your reasoning/i });
    const sendBtn = screen.getByRole('button', { name: /Send Message/i });

    fireEvent.change(input, { target: { value: 'simulate_rate_limit_no_header' } });
    fireEvent.click(sendBtn);

    // Frozen string check: "AI Tutor is currently busy. Please review concepts or continue practice."
    await waitFor(() => {
      expect(
        screen.getByText(/AI Tutor is currently busy. Please review concepts or continue practice./i)
      ).toBeInTheDocument();
    });

    // Invariant: NO fabricated countdown anywhere in document
    expect(screen.queryByText(/Please wait \d+s/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Wait \(\d+s\)/i)).not.toBeInTheDocument();

    // Manual "Try Again" CTA is exposed
    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
    expect(tryAgainBtn).toBeInTheDocument();

    // Clicking manual "Try Again" dismisses busy banner
    fireEvent.click(tryAgainBtn);
    expect(
      screen.queryByText(/AI Tutor is currently busy. Please review concepts or continue practice./i)
    ).not.toBeInTheDocument();
  });
});
