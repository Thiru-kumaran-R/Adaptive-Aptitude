// src/test/integration/adaptivePracticeFlow.test.ts
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdaptivePracticePage } from '../../pages/AdaptivePracticePage';

describe('Adaptive Practice Integration Flow (ACC-09: Zero Optimistic State)', () => {
  it('executes adaptive question loop and awaits authoritative backend response before showing result', async () => {
    const user = userEvent.setup();

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/adaptive?topic=Arithmetic&pattern=Percentages'] },
        React.createElement(AdaptivePracticePage)
      )
    );

    // 1. Initial loading state
    expect(screen.getByRole('heading', { name: /Adaptive Practice Session/i })).toBeInTheDocument();

    // 2. Question loads from MSW
    await waitFor(() => {
      expect(
        screen.getByText(/If the price of an item increases by 20%/i)
      ).toBeInTheDocument();
    });

    // 3. Invariant check: No result/feedback state rendered before submission
    expect(screen.queryByText(/Next Adaptive Question/i)).toBeNull();
    expect(screen.queryByText(/Review the solution steps/i)).toBeNull();

    // 4. Select an option
    const optionBtn = screen.getByRole('radio', { name: /4% decrease/i });
    await user.click(optionBtn);

    // 5. Submit answer
    const submitBtn = screen.getByRole('button', { name: /Submit Answer/i });
    await user.click(submitBtn);

    // 6. Authoritative result displayed ONLY after backend returns
    await waitFor(() => {
      expect(screen.getByText(/Next Adaptive Question/i)).toBeInTheDocument();
    });
  });
});
