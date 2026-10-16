// src/test/components/CognitiveDiagnosticsSvg.test.ts
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CognitiveDiagnosticsSvg } from '../../components/charts/CognitiveDiagnosticsSvg';
import type { CognitiveDiagnosticsViewModel } from '../../types/analytics';

describe('CognitiveDiagnosticsSvg (ACC-15: Accessible SVG)', () => {
  const mockDiagnostics: CognitiveDiagnosticsViewModel = {
    analysisWindow: { windowDays: 30, attemptsAnalyzed: 80 },
    speedAccuracyMatrix: {
      quadrantCounts: {
        accurateAndFast: 40,
        accurateAndSlow: 20,
        fastErrorRushing: 12,
        slowErrorStruggling: 8,
      },
      insufficientBaselineCount: 0,
      rushingRiskScore: 0.15,
      medianTimeCorrectSeconds: 30,
      medianTimeIncorrectSeconds: 45,
    },
    staminaCurve: {
      mockSessionsAnalyzed: 3,
      totalQuestionsAnalyzed: 30,
      quartileAccuracy: [
        { quartile: 1, accuracy: 0.9, totalQuestions: 10, correctQuestions: 9 },
        { quartile: 2, accuracy: 0.8, totalQuestions: 10, correctQuestions: 8 },
        { quartile: 3, accuracy: 0.7, totalQuestions: 10, correctQuestions: 7 },
        { quartile: 4, accuracy: 0.6, totalQuestions: 10, correctQuestions: 6 },
      ],
      fatigueDropoffPercent: 30,
    },
    staminaReason: null,
  };


  it('renders accessible SVG elements with role="img", title, and description', () => {
    const { container } = render(
      React.createElement(CognitiveDiagnosticsSvg, {
        data: mockDiagnostics,
      })
    );

    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);

    for (const svg of svgElements) {
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg.querySelector('title')).toBeInTheDocument();
      expect(svg.querySelector('desc')).toBeInTheDocument();
    }
  });

  it('handles null data gracefully with accessible empty state', () => {
    render(
      React.createElement(CognitiveDiagnosticsSvg, {
        data: null,
      })
    );

    expect(
      screen.getByText(/No cognitive profile diagnostics data available/i)
    ).toBeInTheDocument();
  });
});
