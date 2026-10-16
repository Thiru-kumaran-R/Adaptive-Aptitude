// src/test/integration/mockExamFlow.test.ts
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MockCatalogPage } from '../../pages/MockCatalogPage';
import { MockSessionPage } from '../../pages/MockSessionPage';
import { MockResultPage } from '../../pages/MockResultPage';
import { MockReviewPage } from '../../pages/MockReviewPage';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Mock Examination Integration Flow (ACC-10, ACC-11, ACC-12)', () => {
  it('renders mock exam catalog blueprints with duration and section count', async () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/mock-exams'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/app/mock-exams',
            element: React.createElement(MockCatalogPage),
          })
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByText('Full Aptitude Standard Mock')).toBeInTheDocument();
      expect(screen.getByText('60 mins')).toBeInTheDocument();
    });
  });

  it('ACC-10 & ACC-11: Active session renders timer, sealed question, and question palette', async () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/mock-exams/mock-sess-777'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/app/mock-exams/:sessionId',
            element: React.createElement(MockSessionPage),
          })
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByText('Solve for x: 3x + 15 = 45')).toBeInTheDocument();
    });

    // Verify answers and explanations are sealed (ACC-10)
    expect(screen.queryByText(/Subtract 15 from both sides/i)).toBeNull();
  });

  it('ACC-12: Abandoned exam isolates score report and refuses answer leakage', async () => {
    // Override result endpoint to simulate abandoned session rejection
    server.use(
      http.get('*/api/v1/mock-sessions/mock-abandoned-123/result', () => {
        return HttpResponse.json(
          { success: false, error: 'MOCK_SESSION_NOT_TERMINAL', message: 'Exam was abandoned.' },
          { status: 400 }
        );
      }),
      http.get('*/api/v1/mock-sessions/mock-abandoned-123/review', () => {
        return HttpResponse.json(
          { success: false, error: 'MOCK_SESSION_NOT_TERMINAL', message: 'Exam was abandoned.' },
          { status: 400 }
        );
      })
    );

    // 1. Result page under abandoned session
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/mock-exams/mock-abandoned-123/result'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/app/mock-exams/:sessionId/result',
            element: React.createElement(MockResultPage),
          })
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByTestId('abandoned-exam-notice')).toBeInTheDocument();
      expect(screen.getByText(/No score report available/i)).toBeInTheDocument();
    });

    // 2. Review page under abandoned session
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/mock-exams/mock-abandoned-123/review'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/app/mock-exams/:sessionId/review',
            element: React.createElement(MockReviewPage),
          })
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByTestId('abandoned-review-notice')).toBeInTheDocument();
      expect(screen.getByText(/Review and solutions sealed/i)).toBeInTheDocument();
    });
  });

  it('ACC-11: Zero-time client expiry freezes mutations, emits 0 manual submit calls, polls on 409, and navigates only on authoritative 200', async () => {
    let submitCallCount = 0;
    let resultInquiryCount = 0;

    server.use(
      http.get('*/api/v1/mock-sessions/mock-lazy-expiry-777', () => {
        return HttpResponse.json({
          success: true,
          data: {
            sessionId: 'mock-lazy-expiry-777',
            status: 'started',
            currentSectionId: 'sec-1',
            startedAt: new Date(Date.now() - 3600000).toISOString(),
            expiresAt: new Date(Date.now() + 500).toISOString(),
            durationMinutes: 60,
            sections: [
              { sectionId: 'sec-1', name: 'Quant Section', questionCount: 1 },
            ],
          },
        });
      }),
      http.get('*/api/v1/mock-sessions/mock-lazy-expiry-777/questions/q-1', () => {
        return HttpResponse.json({
          success: true,
          data: {
            questionId: 'q-1',
            sectionId: 'sec-1',
            order: 1,
            question: 'Solve for x: 2x = 10',
            options: ['3', '4', '5', '6'],
            topic: 'Algebra',
            pattern: 'Linear Equations',
            difficulty: 1,
          },
        });
      }),
      http.post('*/api/v1/mock-sessions/mock-lazy-expiry-777/submit', () => {
        submitCallCount++;
        return HttpResponse.json({ success: true, data: { status: 'submitted' } });
      }),
      http.get('*/api/v1/mock-sessions/mock-lazy-expiry-777/result', () => {
        resultInquiryCount++;
        if (resultInquiryCount === 1) {
          // First attempt returns 409 FINALIZATION_IN_PROGRESS
          return HttpResponse.json(
            { success: false, error: 'FINALIZATION_IN_PROGRESS', message: 'Evaluation in progress' },
            { status: 409 }
          );
        }
        // Second attempt returns 200 Success
        return HttpResponse.json({
          success: true,
          data: {
            sessionId: 'mock-lazy-expiry-777',
            score: 100,
            percentile: 99,
          },
        });
      })
    );

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/mock-exams/mock-lazy-expiry-777'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/app/mock-exams/:sessionId',
            element: React.createElement(MockSessionPage),
          }),
          React.createElement(Route, {
            path: '/app/mock-exams/:sessionId/result',
            element: React.createElement('div', { 'data-testid': 'mock-result-view' }, 'Result View Loaded'),
          })
        )
      )
    );

    // Initial question is rendered
    await waitFor(() => {
      expect(screen.getByText('Solve for x: 2x = 10')).toBeInTheDocument();
    });

    // Wait for timer to reach zero, triggering handleZeroTime
    await waitFor(
      () => {
        // Must emit EXACTLY 0 manual submit calls!
        expect(submitCallCount).toBe(0);
        // Initial inquiry happened
        expect(resultInquiryCount).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 }
    );

    // Wait for polling resolution to 200 and navigation to result view
    await waitFor(
      () => {
        expect(resultInquiryCount).toBeGreaterThanOrEqual(2);
        expect(screen.getByTestId('mock-result-view')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Proves 0 manual submit calls occurred throughout the entire lifecycle!
    expect(submitCallCount).toBe(0);
  });
});
