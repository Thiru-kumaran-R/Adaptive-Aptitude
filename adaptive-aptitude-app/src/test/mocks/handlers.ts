// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // ── Operations 1–6: Auth API ──────────────────────────────────────────────
  // Op 1: POST /api/v1/auth/register
  http.post('*/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string };
    return HttpResponse.json(
      {
        success: true,
        data: {
          user: {
            userId: 'user-test-123',
            name: body.name || 'Test Learner',
            email: body.email || 'learner@example.com',
            status: 'active',
          },
        },
      },
      { status: 201 }
    );
  }),

  // Op 2: POST /api/v1/auth/login
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
    if (body.email === 'disabled@example.com') {
      return HttpResponse.json(
        { success: false, error: 'ACCOUNT_DISABLED', message: 'Account is deactivated.' },
        { status: 403 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-jwt-token-xyz',
        user: {
          userId: 'user-test-123',
          name: 'Test Learner',
          email: body.email || 'learner@example.com',
          status: 'active',
        },
      },
    });
  }),

  // Op 3: POST /api/v1/auth/refresh
  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-refreshed-jwt-token-abc',
        user: {
          userId: 'user-test-123',
          name: 'Test Learner',
          email: 'learner@example.com',
          status: 'active',
        },
      },
    });
  }),

  // Op 4: POST /api/v1/auth/logout
  http.post('*/api/v1/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Successfully logged out.',
      },
    });
  }),

  // Op 5: POST /api/v1/auth/revoke-all
  http.post('*/api/v1/auth/revoke-all', () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'All active sessions revoked.',
      },
    });
  }),


  // Op 6: GET /api/v1/auth/me
  http.get('*/api/v1/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          userId: 'user-test-123',
          name: 'Test Learner',
          email: 'learner@example.com',
          status: 'active',
        },
        session: {
          sessionId: 'session-xyz',
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    });
  }),

  // ── Operations 7–13: Question Bank API ────────────────────────────────────
  // Op 7: GET /api/v1/questions/topics
  http.get('*/api/v1/questions/topics', () => {
    return HttpResponse.json({
      success: true,
      count: 3,
      data: ['Arithmetic', 'Algebra', 'Geometry'],
    });
  }),

  // Op 8: GET /api/v1/questions/topic/:topic/patterns
  http.get('*/api/v1/questions/topic/:topic/patterns', () => {
    return HttpResponse.json({
      success: true,
      meta: { topic: 'Arithmetic', count: 2 },
      data: [
        {
          name: 'Percentages',
          slug: 'percentages',
          description: 'Basic and compound percentage calculations.',
          questionCount: 15,
          prerequisites: [],
          aliases: ['pct'],
        },
        {
          name: 'Ratios',
          slug: 'ratios',
          description: 'Proportional division and rates.',
          questionCount: 12,
          prerequisites: ['Percentages'],
          aliases: ['ratio'],
        },
      ],
    });
  }),

  // Op 9: GET /api/v1/questions/topic/:topic
  http.get('*/api/v1/questions/topic/:topic', () => {
    return HttpResponse.json({
      success: true,
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      data: [
        {
          _id: 'q-101',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          difficulty: 2,
          question: 'What is 15% of 80?',
          options: ['10', '12', '14', '16'],
          answer: '12',
          explanation: '15% of 80 = 0.15 * 80 = 12.',
        },
      ],
    });
  }),

  // Op 10: GET /api/v1/questions/topic/:topic/pattern/:pattern
  http.get('*/api/v1/questions/topic/:topic/pattern/:pattern', () => {
    return HttpResponse.json({
      success: true,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      data: [
        {
          _id: 'q-101',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          difficulty: 2,
          question: 'What is 15% of 80?',
          options: ['10', '12', '14', '16'],
          answer: '12',
          explanation: '15% of 80 = 0.15 * 80 = 12.',
        },
      ],
    });
  }),

  // Op 11: GET /api/v1/questions/topic/:topic/random
  http.get('*/api/v1/questions/topic/:topic/random', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          _id: 'q-101',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          difficulty: 2,
          question: 'What is 15% of 80?',
          options: ['10', '12', '14', '16'],
          answer: '12',
          explanation: '15% of 80 = 0.15 * 80 = 12.',
        },
      ],
    });
  }),

  // Op 12: GET /api/v1/questions/topic/:topic/pattern/:pattern/random
  http.get('*/api/v1/questions/topic/:topic/pattern/:pattern/random', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          _id: 'q-101',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          difficulty: 2,
          question: 'What is 15% of 80?',
          options: ['10', '12', '14', '16'],
          answer: '12',
          explanation: '15% of 80 = 0.15 * 80 = 12.',
        },
      ],
    });
  }),

  // Op 13: GET /api/v1/questions/:id
  http.get('*/api/v1/questions/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        topic: 'Arithmetic',
        pattern: 'Percentages',
        difficulty: 2,
        question: 'What is 15% of 80?',
        options: ['10', '12', '14', '16'],
        answer: '12',
        explanation: '15% of 80 = 0.15 * 80 = 12.',
      },
    });
  }),

  // ── Operations 14–19: User Profile & Goals API ────────────────────────────
  // Op 14: GET /api/v1/users/:id
  http.get('*/api/v1/users/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: params.id,
        name: 'Test Learner',
        email: 'learner@example.com',
        status: 'active',
      },
    });
  }),

  // Op 15: GET /api/v1/goals/user/:userId
  http.get('*/api/v1/goals/user/:userId', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          _id: 'goal-primary-001',
          userId: 'user-test-123',
          title: 'Target CAT Examination',
          type: 'exam_prep',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  }),

  // Op 16: POST /api/v1/goals
  http.post('*/api/v1/goals', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'goal-created-002',
        userId: 'user-test-123',
        title: (body.title as string) || 'New Exam Prep Goal',
        type: (body.type as string) || 'exam_prep',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }),

  // Op 17: GET /api/v1/goals/:id
  http.get('*/api/v1/goals/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        userId: 'user-test-123',
        title: 'Target CAT Examination',
        type: 'exam_prep',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Op 18: PATCH /api/v1/goals/:id
  http.patch('*/api/v1/goals/:id', async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        userId: 'user-test-123',
        title: (body.title as string) || 'Updated Goal Title',
        type: 'exam_prep',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Op 19: DELETE /api/v1/goals/:id
  http.delete('*/api/v1/goals/:id', () => {
    return HttpResponse.json({
      success: true,
      data: { deleted: true },
    });
  }),

  // ── Operations 20–26: Planning API ────────────────────────────────────────
  // Op 20: POST /api/v1/planning/preview
  http.post('*/api/v1/planning/preview', () => {
    return HttpResponse.json({
      success: true,
      data: {
        algorithmVersion: 'v1.0.0',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        days: 30,
        durationPreset: '1m',
        dailyQuestionBudget: 20,
        dailyMinutes: 45,
        maxPatternsPerDay: 3,
        patternsRequested: 10,
        prerequisitesAdded: 2,
        prerequisitesList: ['Percentages'],
        patternsAlreadyMastered: 1,
        patternsScheduled: 9,
        patternsUnscheduled: 0,
        unscheduledPatterns: [],
        totalRequestedWorkload: 600,
        horizonQuestionCapacity: 600,
        scheduledWorkload: 600,
        unscheduledWorkload: 0,
        capacityShortfall: false,
        reasonCodes: [],
        proposedTargets: [
          { topic: 'Arithmetic', pattern: 'Percentages', targetQuestions: 60, targetMastery: 0.85 },
        ],
        objectives: [],
      },
    });
  }),

  // Op 21: POST /api/v1/planning/generate
  http.post('*/api/v1/planning/generate', () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          plan: {
            _id: 'plan-gen-001',
            userId: 'user-test-123',
            goalId: 'goal-primary-001',
            name: 'Comprehensive 30-Day Plan',
            scope: 'medium',
            phase: 'core',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
            targetDailyQuestions: 20,
            targetDailyMinutes: 45,
            totalAllocatedQuestions: 600,
            status: 'active',
            planningMeta: {
              algorithmVersion: 'v1.0.0',
              durationPreset: '1m',
              generatedAutomatically: true,
              dailyQuestionBudget: 20,
              dailyMinutes: 45,
              maxPatternsPerDay: 2,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          objectives: [],
          summary: {
            algorithmVersion: 'v1.0.0',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
            days: 30,
            durationPreset: '1m',
            dailyQuestionBudget: 20,
            dailyMinutes: 45,
            maxPatternsPerDay: 2,
            patternsRequested: 10,
            prerequisitesAdded: 2,
            patternsAlreadyMastered: 0,
            patternsScheduled: 12,
            patternsUnscheduled: 0,
            unscheduledPatterns: [],
            totalRequestedWorkload: 240,
            horizonQuestionCapacity: 600,
            scheduledWorkload: 240,
            unscheduledWorkload: 0,
            capacityShortfall: false,
            reasonCodes: [],
          },
        },
      },
      { status: 201 }
    );
  }),


  // Op 22: POST /api/v1/planning/plans/:planId/replan
  http.post('*/api/v1/planning/plans/:planId/replan', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        planId: params.planId,
        replanId: 'replan-001',
        algorithmVersion: 'v1.0.0',
        strategy: 'rebalance',
        scheduledWorkload: 550,
        patternsScheduled: 8,
        reasonCodes: [],
        scheduleSnapshot: { totalObjectives: 28 },
      },
    });
  }),

  // Op 23: GET /api/v1/planning/plans/:planId/schedule
  http.get('*/api/v1/planning/plans/:planId/schedule', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        planId: params.planId,
        planName: 'Comprehensive 30-Day Plan',
        userId: 'user-test-123',
        goalId: 'goal-primary-001',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        status: 'active',
        totalObjectives: 1,
        objectives: [
          {
            date: new Date().toISOString(),
            topic: 'Arithmetic',
            patterns: [{ pattern: 'Percentages', targetQuestions: 20, completedQuestions: 5 }],
          },
        ],
      },
    });
  }),

  // Op 24: GET /api/v1/study-plans/user/:userId
  http.get('*/api/v1/study-plans/user/:userId', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          _id: 'plan-gen-001',
          planId: 'plan-gen-001',
          planName: 'Comprehensive 30-Day Plan',
          userId: 'user-test-123',
          goalId: 'goal-primary-001',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
          status: 'active',
          scheduleSnapshot: { totalObjectives: 30 },
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }),

  // Op 25: GET /api/v1/daily-objectives/user/:userId
  http.get('*/api/v1/daily-objectives/user/:userId', () => {
    return HttpResponse.json({
      success: true,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      data: [
        {
          _id: 'obj-daily-001',
          userId: 'user-test-123',
          planId: 'plan-gen-001',
          targetDate: new Date().toISOString(),
          topic: 'Arithmetic',
          patterns: [{ pattern: 'Percentages', targetQuestions: 20, completedQuestions: 5 }],
          status: 'pending',
          completedQuestions: 5,
          totalQuestions: 20,
        },
      ],
    });
  }),

  // Op 26: PATCH /api/v1/daily-objectives/:id
  http.patch('*/api/v1/daily-objectives/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        status: 'completed',
        completedQuestions: 20,
      },
    });
  }),

  // ── Operations 27–28: Attempts API ────────────────────────────────────────
  // Op 27: POST /api/v1/attempts
  http.post('*/api/v1/attempts', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const isCorrect = body.selectedAnswer === '12';
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'attempt-rec-999',
        userId: 'user-test-123',
        questionId: (body.questionId as string) || 'q-101',
        selectedAnswer: (body.selectedAnswer as string) || '12',
        isCorrect,
        timeTaken: (body.timeTaken as number) || 45,
        source: (body.source as string) || 'practice',
        topic: 'Arithmetic',
        pattern: 'Percentages',
        difficulty: 2,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }),

  // Op 28: GET /api/v1/attempts/user/:userId
  http.get('*/api/v1/attempts/user/:userId', () => {
    return HttpResponse.json({
      success: true,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      data: [
        {
          _id: 'attempt-rec-999',
          userId: 'user-test-123',
          questionId: 'q-101',
          selectedAnswer: '10',
          isCorrect: false,
          timeTaken: 55,
          source: 'practice',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          difficulty: 2,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }),

  // ── Operations 29–33: Progress API ────────────────────────────────────────
  // Op 29: GET /api/v1/progress/:userId
  http.get('*/api/v1/progress/:userId', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          _id: 'prog-001',
          userId: 'user-test-123',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          attempts: 10,
          correct: 8,
          accuracy: 0.8,
          mastery: 0.82,
          streak: 4,
          lastAttemptDate: new Date().toISOString(),
        },
      ],
    });
  }),

  // Op 30: GET /api/v1/progress/:userId/topics
  http.get('*/api/v1/progress/:userId/topics', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          _id: 'prog-top-001',
          userId: 'user-test-123',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          attempts: 10,
          correct: 8,
          accuracy: 0.8,
          mastery: 0.82,
          streak: 4,
        },
      ],
    });
  }),

  // Op 31: GET /api/v1/progress/:userId/patterns
  http.get('*/api/v1/progress/:userId/patterns', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          _id: 'prog-001',
          userId: 'user-test-123',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          attempts: 10,
          correct: 8,
          accuracy: 0.8,
          mastery: 0.82,
          streak: 4,
        },
      ],
    });
  }),

  // Op 32: GET /api/v1/progress/:userId/weakest
  http.get('*/api/v1/progress/:userId/weakest', () => {
    return HttpResponse.json({
      success: true,
      meta: { count: 1 },
      data: [
        {
          topic: 'Arithmetic',
          pattern: 'Percentages',
          accuracy: 0.45,
          attempts: 12,
          mastery: 0.42,
        },
      ],
    });
  }),

  // Op 33: GET /api/v1/progress/prerequisites/:patternName
  http.get('*/api/v1/progress/prerequisites/:patternName', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        pattern: params.patternName,
        topic: 'Arithmetic',
        prerequisites: ['Basic Math'],
        prerequisiteCount: 1,
        dependents: ['Compound Interest'],
        dependentCount: 1,
        isFoundational: false,
      },
    });
  }),


  // ── Operation 34: Adaptive API ────────────────────────────────────────────
  // Op 34: GET /api/v1/adaptive/next-question
  http.get('*/api/v1/adaptive/next-question', () => {
    return HttpResponse.json({
      success: true,
      data: {
        question: {
          _id: 'q-adaptive-001',
          question: 'If the price of an item increases by 20% and then decreases by 20%, what is the net change?',
          options: ['No change', '4% decrease', '4% increase', '2% decrease'],
          topic: 'Arithmetic',
          pattern: 'Percentages',
          difficulty: 3,
        },
        decision: {
          selectedTopic: 'Arithmetic',
          selectedPattern: 'Percentages',
          mastery: 0.65,
          recentAccuracy: 0.7,
          baseDifficulty: 2,
          adjustment: 1,
          targetDifficulty: 3,
          selectedDifficulty: 3,
          fallbackUsed: false,
          prerequisiteRedirect: false,
          reasonCodes: ['NORMAL_PROGRESSION'],
        },
      },
    });
  }),

  // ── Operations 35–37: Spaced Revision API ─────────────────────────────────
  // Op 35: GET /api/v1/revisions/due
  http.get('*/api/v1/revisions/due', () => {
    return HttpResponse.json({
      success: true,
      count: 1,
      data: [
        {
          _id: 'rev-due-001',
          userId: 'user-test-123',
          topic: 'Arithmetic',
          pattern: 'Percentages',
          dueDate: new Date().toISOString(),
          intervalDays: 1,
          stage: 0,
          mastery: 0.75,
          reasonCode: 'STAGE_0_SCHEDULED',
          registryIndex: 1,
        },
      ],
    });
  }),

  // Op 36: GET /api/v1/revisions/plan
  http.get('*/api/v1/revisions/plan', () => {
    return HttpResponse.json({
      success: true,
      data: {
        days: 1,
        referenceDate: new Date().toISOString(),
        projections: [
          {
            date: new Date().toISOString(),
            count: 1,
            patterns: ['Percentages'],
          },
        ],
      },
    });
  }),

  // Op 37: POST /api/v1/revisions/rebuild
  http.post('*/api/v1/revisions/rebuild', () => {
    return HttpResponse.json({
      success: true,
      message: 'Revision queue successfully rebuilt.',
      data: null,
    });
  }),

  // ── Operations 38–48: Mock Examination API ────────────────────────────────
  // Op 38: GET /api/v1/mock-blueprints
  http.get('*/api/v1/mock-blueprints', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'bp-standard-001',
          title: 'Full Aptitude Standard Mock',
          description: 'Timed assessment covering Arithmetic, Algebra and Logic.',
          mode: 'standard',
          totalDurationMinutes: 60,
          sections: [
            {
              sectionId: 'sec-quant-01',
              name: 'Quantitative Aptitude',
              durationMinutes: 30,
              topics: ['Arithmetic'],
              questionCount: 10,
            },
          ],
          status: 'published',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }),

  // Op 39: POST /api/v1/mock-sessions
  http.post('*/api/v1/mock-sessions', () => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'mock-sess-777',
        userId: 'user-test-123',
        blueprintId: 'bp-standard-001',
        status: 'created',
        navigationPolicy: 'free',
        currentSectionId: 'sec-quant-01',
        responsesFrozen: false,
        finalizationState: 'idle',
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }),

  // Op 40: POST /api/v1/mock-sessions/:id/start
  http.post('*/api/v1/mock-sessions/:id/start', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        userId: 'user-test-123',
        blueprintId: 'bp-standard-001',
        status: 'started',
        navigationPolicy: 'free',
        currentSectionId: 'sec-quant-01',
        responsesFrozen: false,
        finalizationState: 'idle',
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1800000).toISOString(),
      },
    });
  }),

  // Op 41: GET /api/v1/mock-sessions/:id
  http.get('*/api/v1/mock-sessions/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        userId: 'user-test-123',
        blueprintId: 'bp-standard-001',
        status: 'started',
        navigationPolicy: 'free',
        currentSectionId: 'sec-quant-01',
        responsesFrozen: false,
        finalizationState: 'idle',
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1800000).toISOString(),
        sections: [
          {
            sectionId: 'sec-quant-01',
            name: 'Quantitative Aptitude',
            durationMinutes: 30,
            status: 'in_progress',
            questionCount: 10,
          },
        ],
      },
    });
  }),

  // Op 42: GET /api/v1/mock-sessions/:id/questions/:questionId
  http.get('*/api/v1/mock-sessions/:id/questions/:questionId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        questionId: params.questionId,
        sectionId: 'sec-quant-01',
        order: 1,
        question: 'Solve for x: 3x + 15 = 45',
        options: ['5', '10', '15', '20'],
        topic: 'Algebra',
        pattern: 'Linear Equations',
        difficulty: 2,
      },
    });
  }),

  // Op 43: POST /api/v1/mock-sessions/:id/responses
  http.post('*/api/v1/mock-sessions/:id/responses', async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'resp-doc-001',
        sessionId: params.id,
        questionId: (body.questionId as string) || 'q-1',
        sectionId: (body.sectionId as string) || 'sec-quant-01',
        selectedOption: (body.selectedOption as string) || '10',
        timeSpentSeconds: (body.timeSpentSeconds as number) || 30,
        isFlagged: Boolean(body.isFlagged),
        status: 'saved',
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Op 44: POST /api/v1/mock-sessions/:id/sections/:sectionId/complete
  http.post('*/api/v1/mock-sessions/:id/sections/:sectionId/complete', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        sessionId: params.id,
        sectionId: params.sectionId,
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
    });
  }),

  // Op 45: POST /api/v1/mock-sessions/:id/submit
  http.post('*/api/v1/mock-sessions/:id/submit', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        userId: 'user-test-123',
        status: 'submitted',
        responsesFrozen: true,
        finalizationState: 'completed',
        submittedAt: new Date().toISOString(),
      },
    });
  }),

  // Op 46: POST /api/v1/mock-sessions/:id/abandon
  http.post('*/api/v1/mock-sessions/:id/abandon', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        userId: 'user-test-123',
        status: 'abandoned',
        abandonedAt: new Date().toISOString(),
      },
    });
  }),

  // Op 47: GET /api/v1/mock-sessions/:id/result
  http.get('*/api/v1/mock-sessions/:id/result', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        sessionId: params.id,
        totalScore: 24,
        maxScore: 30,
        percentage: 80,
        percentile: 88.5,
        sectionScores: [
          {
            sectionId: 'sec-quant-01',
            score: 24,
            maxScore: 30,
            accuracy: 0.8,
          },
        ],
        accuracy: 0.8,
        totalTimeSpentSeconds: 1540,
        speedScore: 78,
        staminaIndex: 82,
      },
    });
  }),

  // Op 48: GET /api/v1/mock-sessions/:id/review
  http.get('*/api/v1/mock-sessions/:id/review', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        sessionId: params.id,
        scoring: {
          sessionId: params.id,
          totalScore: 24,
          maxScore: 30,
          percentage: 80,
          accuracy: 0.8,
          totalTimeSpentSeconds: 1540,
          sectionScores: [],
        },
        questions: [
          {
            questionId: 'q-1',
            order: 1,
            question: 'Solve for x: 3x + 15 = 45',
            options: ['5', '10', '15', '20'],
            selectedOption: '10',
            correctAnswer: '10',
            isCorrect: true,
            explanation: 'Subtract 15 from both sides: 3x = 30. Divide by 3: x = 10.',
            timeSpentSeconds: 42,
            topic: 'Algebra',
            pattern: 'Linear Equations',
            difficulty: 2,
          },
        ],
      },
    });
  }),

  // ── Operations 49–52: Analytics API ───────────────────────────────────────
  // Op 49: GET /api/v1/analytics/dashboard
  http.get('*/api/v1/analytics/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: 'user-test-123',
        algorithmVersion: 'v1.0.0',
        summary: {
          totalPracticeAttempts: 85,
          totalMocksCompleted: 4,
          overallAccuracy: 0.78,
          attemptsAnalyzed: 85,
        },
        topicMasteryRadar: [
          { topic: 'Arithmetic', masteryScore: 0.82, practiceAttempts: 45 },
          { topic: 'Algebra', masteryScore: 0.68, practiceAttempts: 40 },
        ],
        activePlanSummary: null,
        dueRevisionCount: 2,
        priorityFocusTopics: ['Algebra'],
      },
    });
  }),

  // Op 50: GET /api/v1/analytics/cognitive-profile
  http.get('*/api/v1/analytics/cognitive-profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: 'user-test-123',
        algorithmVersion: 'v1.0.0',
        analysisWindow: { windowDays: 30, attemptsAnalyzed: 85 },
        speedAccuracyMatrix: {
          quadrantCounts: {
            accurateAndFast: 45,
            accurateAndSlow: 20,
            fastErrorRushing: 12,
            slowErrorStruggling: 8,
          },
          insufficientBaselineCount: 0,
          rushingRiskScore: 0.14,
          strugglingRiskScore: 0.09,
          dominantQuadrant: 'accurateAndFast',
        },
        staminaCurve: {
          mockSessionsAnalyzed: 4,
          totalQuestionsAnalyzed: 40,
          quartileAccuracy: [
            { quartile: 1, accuracy: 0.85, totalQuestions: 10, correctQuestions: 8 },
            { quartile: 2, accuracy: 0.8, totalQuestions: 10, correctQuestions: 8 },
            { quartile: 3, accuracy: 0.75, totalQuestions: 10, correctQuestions: 7 },
            { quartile: 4, accuracy: 0.7, totalQuestions: 10, correctQuestions: 7 },
          ],
          fatigueDropoffPercent: 15,
          fatigueReason: 'Mild fatigue in final quartile.',
        },
        staminaReason: 'Slight accuracy reduction observed towards end of 60-min exams.',
      },
    });
  }),

  // Op 51: GET /api/v1/analytics/retention
  http.get('*/api/v1/analytics/retention', () => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: 'user-test-123',
        algorithmVersion: 'v1.0.0',
        currentState: {
          activeRevisionItems: 14,
          completedRevisionItems: 38,
          dueTodayCount: 2,
          overdueCount: 0,
          stageDistribution: {
            stage0_1day: 4,
            stage1_3days: 3,
            stage2_7days: 3,
            stage3_14days: 2,
            stage4_30days: 2,
          },
        },
        observedRetentionByGap: [
          { gapDays: 1, recallProbability: 0.92, attemptsCount: 20 },
          { gapDays: 3, recallProbability: 0.85, attemptsCount: 15 },
          { gapDays: 7, recallProbability: 0.78, attemptsCount: 12 },
        ],
        evidence: {
          revisionAttemptsAnalyzed: 47,
          excludedNoPriorAttemptCount: 0,
          excludedShortGapCount: 0,
          excludedInvalidChronologyCount: 0,
        },
      },
    });
  }),

  // Op 52: GET /api/v1/analytics/readiness/:goalId
  http.get('*/api/v1/analytics/readiness/:goalId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        goalId: params.goalId,
        goalTitle: 'Target CAT Examination',
        targetDate: new Date(Date.now() + 86400000 * 45).toISOString(),
        algorithmVersion: 'v1.0.0',
        readinessStatus: 'calculated',
        readinessScore: 0.74,
        reason: 'Solid topic mastery with moderate pacing risk.',
        components: {
          planTargetCoverage: 0.85,
          masteryDepth: 0.76,
          eligibleMockPerformance: 0.72,
          eligibleMockPacing: 0.65,
        },
        criticalPrerequisiteBottlenecks: [
          {
            targetPattern: 'Compound Interest',
            unmasteredPrerequisite: 'Percentages',
            prerequisiteMastery: 0.52,
            masteryLabel: 'developing',
          },
        ],
      },
    });
  }),

  // ── Operations 53–57 & 64: Orchestration & Attribution API ────────────────
  // Op 53: GET /api/v1/orchestration/next-action
  http.get('*/api/v1/orchestration/next-action', () => {
    return HttpResponse.json({
      success: true,
      meta: { referenceNow: new Date().toISOString() },
      data: {
        status: 'recommended',
        reason: 'Priority bottleneck identified in Percentages.',
        nextAction: {
          actionId: 'act-next-001',
          actionType: 'targeted_drill',
          priorityTier: 1,
          policyPriorityClass: 'PREREQUISITE_DEFICIT',
          urgencyScore: 92,
          topic: 'Arithmetic',
          pattern: 'Percentages',
          prescribedQuestions: 10,
          estimatedMinutes: 20,
          rationale: 'Prerequisite remediation for Compound Interest.',
          executionIntent: 'Targeted drill on fundamental percentages.',
        },
      },
    });
  }),

  // Op 54: GET /api/v1/orchestration/daily-agenda
  http.get('*/api/v1/orchestration/daily-agenda', () => {
    return HttpResponse.json({
      success: true,
      meta: { referenceNow: new Date().toISOString() },
      data: {
        status: 'active',
        agenda: {
          dailyQuestionBudget: 25,
          totalPrescribedQuestions: 20,
          totalEstimatedMinutes: 40,
          segments: [
            {
              segmentIndex: 0,
              segmentName: 'Core Prerequisite Remediation',
              segmentBudget: 10,
              allocatedQuestions: 10,
              activities: [
                {
                  actionId: 'act-agenda-001',
                  actionType: 'adaptive_drill',
                  priorityTier: 1,
                  policyPriorityClass: 'REVISION_OVERDUE',
                  urgencyScore: 88,
                  topic: 'Arithmetic',
                  pattern: 'Percentages',
                  prescribedQuestions: 10,
                  estimatedMinutes: 20,
                  rationale: 'Review scheduled due item.',
                  executionIntent: 'Reinforce percentage conversions.',
                },
              ],
            },
          ],
          checkpoints: [],
        },
      },
    });
  }),

  // Op 55: GET /api/v1/orchestration/interventions
  http.get('*/api/v1/orchestration/interventions', () => {
    return HttpResponse.json({
      success: true,
      meta: { referenceNow: new Date().toISOString() },
      data: {
        status: 'active',
        interventions: [
          {
            interventionId: 'int-001',
            category: 'PREREQUISITE_DEFICIT',
            severity: 'high',
            topic: 'Arithmetic',
            pattern: 'Percentages',
            blockedTarget: 'Compound Interest',
            rationale: 'Prerequisite remediation recommended.',
          },
        ],
      },
    });
  }),

  // Op 64: POST /api/v1/attribution/prescriptions (Issue Prescription)
  http.post('*/api/v1/attribution/prescriptions', async ({ request }) => {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return HttpResponse.json(
        { success: false, error: 'MISSING_IDEMPOTENCY_KEY', message: 'Idempotency-Key header is required.' },
        { status: 400 }
      );
    }
    const isReplay = idempotencyKey.includes('replay');
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: {
          prescriptionId: 'presc-issued-999',
          originSurface: (body.originSurface as string) || 'next_action',
          actionId: (body.actionId as string) || 'act-next-001',
          status: 'issued',
          issuedAt: new Date().toISOString(),
        },
      },
      { status: isReplay ? 200 : 201 }
    );
  }),

  // Op 56: POST /api/v1/attribution/prescriptions/:prescriptionId/activate
  http.post('*/api/v1/attribution/prescriptions/:prescriptionId/activate', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        prescriptionId: params.prescriptionId,
        status: 'active',
        activatedAt: new Date().toISOString(),
      },
    });
  }),

  // Op 57: POST /api/v1/attribution/prescriptions/:prescriptionId/complete
  http.post('*/api/v1/attribution/prescriptions/:prescriptionId/complete', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        prescriptionId: params.prescriptionId,
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
    });
  }),

  // ── Operations 58–63: Socratic AI & Learning API ──────────────────────────
  // Op 58: POST /api/v1/learning/tutor
  http.post('*/api/v1/learning/tutor', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { message?: string };
    if (body.message?.includes('simulate_rate_limit_10')) {
      return HttpResponse.json(
        { success: false, error: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded.' },
        { status: 429, headers: { 'Retry-After': '10' } }
      );
    }
    if (body.message?.includes('simulate_rate_limit_no_header')) {
      return HttpResponse.json(
        { success: false, error: 'RATE_LIMIT_CAPACITY_EXCEEDED', message: 'Rate limit capacity exceeded.' },
        { status: 429 }
      );
    }
    if (body.message?.includes('simulate_rate_limit')) {
      return HttpResponse.json(
        { success: false, error: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded.' },
        { status: 429, headers: { 'Retry-After': '30' } }
      );
    }
    return HttpResponse.json({
      data: {
        topic: 'Arithmetic',
        pattern: 'Percentages',
        conceptExplanation: 'Percentages represent a fraction of 100. To find P% of a quantity Q, calculate (P / 100) * Q.',
        formulaSummary: 'P% of Q = (P / 100) * Q',
        workedExample: {
          setup: 'Find 25% of 240',
          solutionSteps: ['Convert 25% to decimal: 0.25', 'Multiply: 0.25 * 240 = 60'],
          finalResult: '60',
        },
        keyTakeaway: 'Always express percentages as decimals or simplified fractions before multiplication.',
      },
      metadata: { taskType: 'tutor', algorithmVersion: '1.0.0', promptVersion: '1.0', model: 'mock-llm', provider: 'gemini', isDegraded: false, degradationReason: null },
      provenance: { facts: ['Percentage definition'], deterministicSignals: [], llmInterpretations: [] },
    });
  }),

  // Op 59: POST /api/v1/learning/hint
  http.post('*/api/v1/learning/hint', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { hintLevel?: number };
    const level = body.hintLevel || 1;
    return HttpResponse.json({
      data: {
        hintLevel: level,
        hint: `Hint Tier ${level}: Analyze the given proportional ratio before computing.`,
        revealsAnswer: level === 5,
        nextAction: 'try_calculation',
      },
      metadata: { taskType: 'hint', algorithmVersion: '1.0.0', promptVersion: '1.0', model: 'mock-llm', provider: 'gemini', isDegraded: false, degradationReason: null },
      provenance: { facts: [], deterministicSignals: [], llmInterpretations: [] },
    });
  }),

  // Op 60: POST /api/v1/learning/explain-attempt
  http.post('*/api/v1/learning/explain-attempt', () => {
    return HttpResponse.json({
      data: {
        conceptSummary: 'Arithmetic percentages',
        mistakeExplanation: 'You likely subtracted 5 from 15 instead of calculating 15% of 80.',
        correctApproach: 'Remember to multiply 0.15 by the base quantity 80.',
        revisionSuggestion: 'Review percentage calculation rules.',
        confidence: 0.95,
      },
      metadata: { taskType: 'explain_attempt', algorithmVersion: '1.0.0', promptVersion: '1.0', model: 'mock-llm', provider: 'gemini', isDegraded: false, degradationReason: null },
      provenance: { facts: [], deterministicSignals: [], llmInterpretations: [] },
    });
  }),

  // Op 61: POST /api/v1/learning/explain-progress
  http.post('*/api/v1/learning/explain-progress', () => {
    return HttpResponse.json({
      data: {
        masteryInterpretation: 'Strong foundational accuracy across Arithmetic with opportunities to improve Algebra pacing.',
        strengths: ['Percentages', 'Ratios'],
        weaknesses: ['Linear Equations'],
        recommendedAction: 'Algebra drills on two-variable systems.',
      },
      metadata: { taskType: 'explain_progress', algorithmVersion: '1.0.0', promptVersion: '1.0', model: 'mock-llm', provider: 'gemini', isDegraded: false, degradationReason: null },
      provenance: { facts: [], deterministicSignals: [], llmInterpretations: [] },
    });
  }),

  // Op 62: POST /api/v1/learning/explain-plan
  http.post('*/api/v1/learning/explain-plan', () => {
    return HttpResponse.json({
      data: {
        planId: 'plan-gen-001',
        targetDate: '2026-10-20',
        objectiveSummary: 'A structured 30-day curriculum targeted at elevating Quant readiness.',
        schedulingReasons: ['Graduated difficulty scaling with fixed-stage spaced reviews every weekend.'],
        revisionSummary: 'Fixed-stage spaced reviews scheduled every weekend.',
        recommendedAction: 'Complete today\'s prescribed agenda items.',
      },
      metadata: { taskType: 'explain_plan', algorithmVersion: '1.0.0', promptVersion: '1.0', model: 'mock-llm', provider: 'gemini', isDegraded: false, degradationReason: null },
      provenance: { facts: [], deterministicSignals: [], llmInterpretations: [] },
    });
  }),

  // Op 63: POST /api/v1/learning/mock-review
  http.post('*/api/v1/learning/mock-review', () => {
    return HttpResponse.json({
      data: {
        overallScoreInterpretation: 'You scored in the 88th percentile. Pacing was consistent throughout Section 1.',
        sectionDiagnostics: [
          {
            sectionId: 'sec-quant-01',
            diagnosticMessage: 'Accurate and fast in Arithmetic; minor calculation slip on Question 3.',
            performanceTier: 'strong',
          },
        ],
        pacingObservations: 'Average time per question was 42 seconds, well within the 60-second threshold.',
        priorityRevisionPatterns: ['Percentages'],
      },
      metadata: { taskType: 'mock_review', algorithmVersion: '1.0.0', promptVersion: '1.0', model: 'mock-llm', provider: 'gemini', isDegraded: false, degradationReason: null },
      provenance: { facts: [], deterministicSignals: [], llmInterpretations: [] },
    });
  }),
];
