// src/test/components/QuestionCard.test.ts
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import type { QuestionDto, ActiveMockQuestionDto, MockReviewQuestionDto } from '../../types/api';

describe('QuestionCard (Component & Anti-Leakage)', () => {
  const standardQuestion: QuestionDto = {
    _id: 'q-standard-1',
    topic: 'Arithmetic',
    pattern: 'Percentages',
    difficulty: 2,
    question: 'What is 20% of 150?',
    options: ['20', '30', '40', '50'],
    answer: '30',
    explanation: '20% of 150 is 30.',
  };

  const activeMockQuestion: ActiveMockQuestionDto = {
    questionId: 'q-mock-1',
    sectionId: 'sec-1',
    order: 1,
    topic: 'Arithmetic',
    pattern: 'Percentages',
    difficulty: 2,
    question: 'What is 20% of 150?',
    options: ['20', '30', '40', '50'],
  };

  const mockReviewQuestion: MockReviewQuestionDto = {
    questionId: 'q-mock-1',
    order: 1,
    topic: 'Arithmetic',
    pattern: 'Percentages',
    difficulty: 2,
    question: 'What is 20% of 150?',
    options: ['20', '30', '40', '50'],
    selectedOption: '20',
    correctAnswer: '30',
    isCorrect: false,
    explanation: 'Multiply 0.20 by 150 to get 30.',
    timeSpentSeconds: 45,
  };

  it('renders standard practice question and allows option selection', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleSubmit = vi.fn();

    render(
      React.createElement(QuestionCard, {
        mode: 'PRACTICE',
        question: standardQuestion,
        selectedOption: '30',
        onSelectOption: handleSelect,
        onSubmitAnswer: handleSubmit,
      })
    );

    expect(screen.getByText('What is 20% of 150?')).toBeInTheDocument();
    const optionButton = screen.getByRole('radio', { name: /30/i });
    expect(optionButton).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /40/i }));
    expect(handleSelect).toHaveBeenCalledWith('40');
  });

  it('ACC-10: Active mock exam mode seals answer and explanation from DOM', () => {
    const handleSelect = vi.fn();
    const handleFlag = vi.fn();

    const { container } = render(
      React.createElement(QuestionCard, {
        mode: 'MOCK_EXAM',
        question: activeMockQuestion,
        selectedOption: null,
        onSelectOption: handleSelect,
        onFlagForReview: handleFlag,
      })
    );

    // Verify question is visible
    expect(screen.getByText('What is 20% of 150?')).toBeInTheDocument();

    // Verify answers and explanations are completely absent from DOM
    expect(container.textContent).not.toContain('20% of 150 is 30');
    expect(container.querySelector('[data-testid="explanation"]')).toBeNull();

    // Verify active mock data attributes reflect sealed exam state
    const cardEl = container.querySelector('[data-testid="question-card"]');
    expect(cardEl).toHaveAttribute('data-mode', 'MOCK_EXAM');
  });

  it('renders post-exam review question with marked correct/incorrect options', () => {
    render(
      React.createElement(QuestionCard, {
        mode: 'MOCK_REVIEW',
        question: mockReviewQuestion,
      })
    );

    expect(screen.getByText('What is 20% of 150?')).toBeInTheDocument();
    // In review mode, buttons are disabled
    const buttons = screen.getAllByRole('radio');
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
  });
});
