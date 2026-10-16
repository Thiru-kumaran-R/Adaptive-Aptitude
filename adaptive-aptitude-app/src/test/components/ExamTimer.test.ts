// src/test/components/ExamTimer.test.ts
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ExamTimer } from '../../components/quiz/ExamTimer';

describe('ExamTimer (ACC-11: Countdown & Expiry)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders countdown formatted as MM:SS and updates every second', () => {
    const futureTime = Date.now() + 125 * 1000; // 2 minutes, 5 seconds

    render(
      React.createElement(ExamTimer, {
        expiresAt: futureTime,
      })
    );

    expect(screen.getByText('02:05')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('triggers onZeroTime callback when authoritative expiry is reached', () => {
    const onZeroTime = vi.fn();
    const futureTime = Date.now() + 2000; // 2 seconds

    render(
      React.createElement(ExamTimer, {
        expiresAt: futureTime,
        onZeroTime,
      })
    );

    expect(screen.getByText('00:02')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(onZeroTime).toHaveBeenCalled();
  });
});
