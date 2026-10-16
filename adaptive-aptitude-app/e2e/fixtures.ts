// e2e/fixtures.ts
import { test as base, expect, Page, BrowserContext } from '@playwright/test';

export interface FetchObservation {
  url: string;
  method: string;
  credentials: string;
  hasOriginHeader: boolean;
}

export interface TestApiState {
  currentAccessToken: string;
  tokenGeneration: 'A' | 'B' | 'C';
  refreshTokenCookie: string | null;
  issuedPrescriptions: Map<string, {
    prescriptionId: string;
    actionId?: string;
    originSurface: string;
    idempotencyKey?: string;
    status: 'issued' | 'active' | 'completed' | 'abandoned';
  }>;
  mockSessions: Map<string, {
    sessionId: string;
    status: 'created' | 'started' | 'submitted' | 'abandoned';
    currentSectionId?: string;
    answers: Record<string, string>;
  }>;
}

type CustomFixtures = {
  apiState: TestApiState;
  seedAuthenticatedSession: () => Promise<void>;
  clearSessionCookies: () => Promise<void>;
  getFetchObservations: () => Promise<FetchObservation[]>;
};

export const test = base.extend<CustomFixtures>({
  apiState: async ({}, use) => {
    const state: TestApiState = {
      currentAccessToken: 'test-access-token-gen-A',
      tokenGeneration: 'A',
      refreshTokenCookie: null,
      issuedPrescriptions: new Map(),
      mockSessions: new Map(),
    };
    await use(state);
  },

  seedAuthenticatedSession: async ({ context, apiState }, use) => {
    await use(async () => {
      apiState.tokenGeneration = 'A';
      apiState.currentAccessToken = 'test-access-token-gen-A';
      apiState.refreshTokenCookie = 'opaque-refresh-cookie-gen-A';

      await context.addCookies([
        {
          name: 'refreshToken',
          value: 'opaque-refresh-cookie-gen-A',
          domain: '127.0.0.1',
          path: '/api/v1/auth/refresh',
          httpOnly: true,
          sameSite: 'Strict',
          secure: false, // Local non-TLS test representation
        },
      ]);
    });
  },

  clearSessionCookies: async ({ context, apiState }, use) => {
    await use(async () => {
      apiState.refreshTokenCookie = null;
      await context.clearCookies();
    });
  },

  getFetchObservations: async ({ page }, use) => {
    await use(async () => {
      return page.evaluate(() => {
        return (window as unknown as { __FETCH_OBSERVATIONS__?: FetchObservation[] }).__FETCH_OBSERVATIONS__ || [];
      });
    });
  },

  page: async ({ page, context, apiState }, use) => {
    // Install test-only fetch observer to verify native browser credentials mode and lack of custom Origin header
    await page.addInitScript(() => {
      const observations: FetchObservation[] = [];
      (window as unknown as { __FETCH_OBSERVATIONS__: FetchObservation[] }).__FETCH_OBSERVATIONS__ = observations;

      const originalFetch = window.fetch;
      window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
        try {
          const req = new Request(input, init);
          observations.push({
            url: req.url,
            method: req.method,
            credentials: req.credentials,
            hasOriginHeader: init?.headers ? new Headers(init.headers).has('origin') : false,
          });
        } catch {
          // Ignore inspection errors
        }
        return originalFetch.apply(this, [input, init]);
      };
    });

    // Intercept all /api/v1/** requests on the same-origin
    await page.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();

      // ── Operations 1–6: Auth API ───────────────────────────────────────────
      if (path === '/api/v1/auth/register' && method === 'POST') {
        const body = request.postDataJSON() || {};
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                userId: 'user-e2e-123',
                name: body.name || 'Test Learner',
                email: body.email || 'learner@example.com',
              },
            },
          }),
        });
      }

      if (path === '/api/v1/auth/login' && method === 'POST') {
        apiState.tokenGeneration = 'A';
        apiState.currentAccessToken = 'test-access-token-gen-A';
        apiState.refreshTokenCookie = 'opaque-refresh-cookie-gen-A';

        await context.addCookies([
          {
            name: 'refreshToken',
            value: 'opaque-refresh-cookie-gen-A',
            domain: '127.0.0.1',
            path: '/api/v1/auth/refresh',
            httpOnly: true,
            sameSite: 'Strict',
            secure: false,
          },
        ]);

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'test-access-token-gen-A',
              expiresIn: 900,
              user: {
                userId: 'user-e2e-123',
                name: 'Test Learner',
                email: 'learner@example.com',
              },
            },
          }),
        });
      }

      if (path === '/api/v1/auth/refresh' && method === 'POST') {
        const cookies = await context.cookies('http://127.0.0.1:5173/api/v1/auth/refresh');
        const refreshCookie = cookies.find((c) => c.name === 'refreshToken');

        if (!refreshCookie || !apiState.refreshTokenCookie) {
          return route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'No valid refresh session.' },
            }),
          });
        }

        // Rotate token to Generation B
        apiState.tokenGeneration = 'B';
        apiState.currentAccessToken = 'test-access-token-gen-B';
        apiState.refreshTokenCookie = 'opaque-refresh-cookie-gen-B';

        await context.addCookies([
          {
            name: 'refreshToken',
            value: 'opaque-refresh-cookie-gen-B',
            domain: '127.0.0.1',
            path: '/api/v1/auth/refresh',
            httpOnly: true,
            sameSite: 'Strict',
            secure: false,
          },
        ]);

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'test-access-token-gen-B',
              expiresIn: 900,
            },
          }),
        });
      }

      if (path === '/api/v1/auth/me' && method === 'GET') {
        const authHeader = request.headers()['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'Missing bearer access token.' },
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                userId: 'user-e2e-123',
                name: 'Test Learner',
                email: 'learner@example.com',
              },
              session: {
                sessionId: 'sess-e2e-001',
                deviceType: 'desktop',
                ipAddress: '127.0.0.1',
                lastActiveAt: new Date().toISOString(),
              },
            },
          }),
        });
      }

      if (path === '/api/v1/auth/logout' && method === 'POST') {
        apiState.refreshTokenCookie = null;
        await context.clearCookies();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'Successfully logged out.' },
          }),
        });
      }

      if (path === '/api/v1/auth/revoke-all' && method === 'POST') {
        apiState.refreshTokenCookie = null;
        await context.clearCookies();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'All active sessions revoked.' },
          }),
        });
      }

      // Op 14: GET /api/v1/users/:userId
      if (path.startsWith('/api/v1/users/') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              userId: 'user-e2e-123',
              name: 'Test Learner',
              email: 'learner@example.com',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      }

      // ── Operations 14–19: Goals API ────────────────────────────────────────
      if ((path === '/api/v1/goals' || path.startsWith('/api/v1/goals/user/')) && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                _id: 'goal-primary-001',
                userId: 'user-e2e-123',
                title: 'Target 99th Percentile Quant',
                targetScore: 99,
                targetDate: new Date(Date.now() + 86400000 * 30).toISOString(),
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        });
      }

      if (path === '/api/v1/goals' && method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'goal-primary-001',
              userId: 'user-e2e-123',
              title: 'Target 99th Percentile Quant',
              targetScore: 99,
              targetDate: new Date(Date.now() + 86400000 * 30).toISOString(),
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      }

      if (path === '/api/v1/goals/active' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'goal-primary-001',
              userId: 'user-e2e-123',
              title: 'Target 99th Percentile Quant',
              targetScore: 99,
              targetDate: new Date(Date.now() + 86400000 * 30).toISOString(),
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      }

      // ── Operations 20–24: Planning API ─────────────────────────────────────
      if (path === '/api/v1/planning/plans' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                _id: 'plan-gen-001',
                userId: 'user-e2e-123',
                goalId: 'goal-primary-001',
                name: 'Quant Master 30-Day Plan',
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
            ],
          }),
        });
      }

      if (path === '/api/v1/planning/generate' && method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              plan: {
                _id: 'plan-gen-001',
                userId: 'user-e2e-123',
                goalId: 'goal-primary-001',
                name: 'Quant Master 30-Day Plan',
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
          }),
        });
      }

      if (path.startsWith('/api/v1/planning/plans/') && path.endsWith('/schedule')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              planId: 'plan-gen-001',
              objectives: [
                {
                  _id: 'obj-001',
                  date: new Date().toISOString().slice(0, 10),
                  targetQuestions: 20,
                  completedQuestions: 5,
                  patterns: [
                    { pattern: 'Percentages', targetQuestions: 10, completedQuestions: 5 },
                    { pattern: 'Ratios', targetQuestions: 10, completedQuestions: 0 },
                  ],
                  targetMinutes: 45,
                  actualMinutes: 12,
                  status: 'in_progress',
                },
              ],
            },
          }),
        });
      }

      // ── Operations 53–55: Orchestration API ───────────────────────────────
      if (path.startsWith('/api/v1/orchestration/') && path.endsWith('/next-action')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              status: 'RECOMMENDED',
              reason: 'Scheduled pattern drill',
              activeMockSessionId: null,
              nextAction: {
                actionId: 'act-next-001',
                actionType: 'pattern_practice',
                priorityTier: 1,
                policyPriorityClass: 'CORE',
                urgencyScore: 85,
                topic: 'Arithmetic',
                pattern: 'Percentages',
                prescribedQuestions: 5,
                estimatedMinutes: 15,
                rationale: 'Strengthen core Percentages pattern before tomorrow\'s scheduled mock.',
                executionIntent: 'PRACTICE',
              },
            },
            meta: {
              referenceNow: new Date().toISOString(),
            },
          }),
        });
      }

      if (path.startsWith('/api/v1/orchestration/') && path.endsWith('/daily-agenda')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              userId: 'user-e2e-123',
              goalId: 'goal-primary-001',
              date: new Date().toISOString().slice(0, 10),
              status: 'active',
              totalAllocatedMinutes: 45,
              completedMinutes: 12,
              segments: [
                {
                  segmentType: 'revision',
                  title: 'Spaced Retention Practice',
                  description: 'Stage 0 reviews for high-urgency arithmetic patterns.',
                  targetQuestions: 5,
                  completedQuestions: 5,
                  allocatedMinutes: 10,
                  actualMinutes: 8,
                  status: 'completed',
                  actionId: 'rec-agenda-rev-01',
                  topic: 'Arithmetic',
                  pattern: 'Percentages',
                },
                {
                  segmentType: 'core_practice',
                  title: 'Core Pattern Mastery',
                  description: 'Targeted drill on two-variable systems.',
                  targetQuestions: 10,
                  completedQuestions: 0,
                  allocatedMinutes: 20,
                  actualMinutes: 0,
                  status: 'pending',
                  actionId: 'rec-agenda-core-02',
                  topic: 'Algebra',
                  pattern: 'Linear Equations',
                },
                {
                  segmentType: 'mock_exam',
                  title: 'Weekly Sectional Checkpoint',
                  description: 'Full sectional exam to test speed and pacing under timed conditions.',
                  targetQuestions: 15,
                  completedQuestions: 0,
                  allocatedMinutes: 15,
                  actualMinutes: 0,
                  status: 'pending',
                  actionId: 'rec-agenda-mock-03',
                  topic: 'Quant Diagnostic',
                  pattern: 'Full Section',
                },
              ],
            },
          }),
        });
      }

      // ── Operations 64, 56, 57: Attribution Lifecycle ──────────────────────
      // Op 64: Issuance (POST /api/v1/attribution/prescriptions)
      if (path === '/api/v1/attribution/prescriptions' && method === 'POST') {
        const body = request.postDataJSON() || {};
        const idempotencyKey = request.headers()['idempotency-key'];
        const rxId = 'prescription-rx-777';

        apiState.issuedPrescriptions.set(rxId, {
          prescriptionId: rxId,
          actionId: body.actionId,
          originSurface: body.originSurface || 'next_action',
          idempotencyKey,
          status: 'issued',
        });

        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              prescriptionId: rxId,
              status: 'issued',
              actionType: 'pattern_practice',
              topic: 'Arithmetic',
              pattern: 'Percentages',
              prescribedQuestions: 5,
              targetSource: body.originSurface || 'next_action',
              idempotencyKey: idempotencyKey || null,
              issuedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              versions: {
                phase10AlgorithmVersion: 'v1.0.0',
                orchestrationAlgorithmVersion: 'v1.0.0',
              },
            },
            meta: {
              referenceNow: new Date().toISOString(),
            },
          }),
        });
      }

      // Op 56: Activation (POST /api/v1/attribution/prescriptions/:prescriptionId/activate)
      if (path.startsWith('/api/v1/attribution/prescriptions/') && path.endsWith('/activate') && method === 'POST') {
        const parts = path.split('/');
        const rxId = parts[parts.length - 2];
        const record = apiState.issuedPrescriptions.get(rxId) || {
          prescriptionId: rxId,
          status: 'issued',
          originSurface: 'next_action',
        };
        record.status = 'active';
        apiState.issuedPrescriptions.set(rxId, record);

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              prescriptionId: rxId,
              status: 'active',
              effectiveStatus: 'active',
              isExpired: false,
              actionType: 'pattern_practice',
              topic: 'Arithmetic',
              pattern: 'Percentages',
              prescribedQuestions: 5,
              activatedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              executionGuidance: {
                targetMode: 'pattern_practice',
                instructions: 'Solve 5 percentage questions with precision focus.',
                targetSource: record.originSurface,
              },
            },
            meta: {
              referenceNow: new Date().toISOString(),
            },
          }),
        });
      }

      // Op 57: Completion (POST /api/v1/attribution/prescriptions/:prescriptionId/complete)
      if (path.startsWith('/api/v1/attribution/prescriptions/') && path.endsWith('/complete') && method === 'POST') {
        const parts = path.split('/');
        const rxId = parts[parts.length - 2];
        const record = apiState.issuedPrescriptions.get(rxId);
        if (record) record.status = 'completed';

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              prescriptionId: rxId,
              status: 'completed',
              completedAt: new Date().toISOString(),
              completionType: 'full',
              attributedAttemptsCount: 5,
              durationSeconds: 150,
              mockSessionId: null,
              attributionNotice: 'Prescription completed with full compliance.',
            },
            meta: {
              referenceNow: new Date().toISOString(),
            },
          }),
        });
      }

      // ── Operations 7–13: Questions API ────────────────────────────────────
      if (path === '/api/v1/questions/topics' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              'Arithmetic',
              'Algebra',
              'Geometry',
              'Number Properties',
              'Word Problems',
            ],
          }),
        });
      }

      if (path.startsWith('/api/v1/questions/topic/') && path.endsWith('/patterns') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              'Percentages',
              'Ratios & Proportions',
              'Profit & Loss',
              'Simple & Compound Interest',
            ],
          }),
        });
      }

      if (
        ((path.includes('/questions/topic/') && path.includes('/pattern/')) ||
          path.startsWith('/api/v1/questions/pattern/')) &&
        method === 'GET'
      ) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                _id: 'q-arith-101',
                question: 'If 25% of X is equal to 50, what is the value of X?',
                options: ['100', '150', '200', '250'],
                topic: 'Arithmetic',
                pattern: 'Percentages',
                difficulty: 2,
                answer: '200',
                explanation: 'X = 50 / 0.25 = 200.',
              },
            ],
            meta: { totalCount: 1, page: 1, limit: 10 },
          }),
        });
      }

      // ── Operations 29–32: Progress API ────────────────────────────────────
      if (path.startsWith('/api/v1/progress/') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                pattern: 'Percentages',
                topic: 'Arithmetic',
                accuracy: 0.65,
                urgency: 0.8,
              },
            ],
          }),
        });
      }

      // ── Operation 34: Adaptive API ────────────────────────────────────────
      if (path === '/api/v1/adaptive/next-question' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              question: {
                _id: 'q-adaptive-001',
                question: 'If a quantity increases by 20% then decreases by 20%, what is the net change?',
                options: ['No change', '4% decrease', '4% increase', '2% decrease'],
                topic: 'Arithmetic',
                pattern: 'Percentages',
                difficulty: 3,
                // Adaptive questions must omit answer and explanation
              },
              decision: {
                selectedDifficulty: 3,
                selectedTopic: 'Arithmetic',
                selectedPattern: 'Percentages',
                reason: 'BALANCED_STABILITY',
                prerequisiteRedirect: false,
              },
            },
          }),
        });
      }

      // ── Operations 25–28: Attempt API ─────────────────────────────────────
      if (path === '/api/v1/attempts' && method === 'POST') {
        const body = request.postDataJSON() || {};
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              attemptId: 'att-e2e-999',
              questionId: body.questionId || 'q-adaptive-001',
              selectedAnswer: body.selectedAnswer,
              isCorrect: true,
              timeTaken: body.timeTaken || 35,
              evaluatedAt: new Date().toISOString(),
              source: body.source || 'practice',
              explanation: 'Net change = 1.2 * 0.8 = 0.96 (4% decrease).',
            },
          }),
        });
      }

      // ── Operations 35–37: Revision API ────────────────────────────────────
      if (path === '/api/v1/revisions/due' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            count: 1,
            data: [
              {
                _id: 'rev-due-001',
                topic: 'Arithmetic',
                pattern: 'Percentages',
                stage: 0,
                dueDate: new Date().toISOString(),
                reasonCode: 'decay_interval_elapsed',
                mastery: 0.65,
                intervalDays: 1,
              },
            ],
          }),
        });
      }

      if (path === '/api/v1/revisions/plan' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
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
          }),
        });
      }

      // ── Operations 38–48: Mock Examination API ────────────────────────────
      if ((path === '/api/v1/mock/blueprints' || path === '/api/v1/mock-blueprints') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                _id: 'bp-quant-full-01',
                blueprintId: 'bp-quant-full-01',
                title: 'Full-Length Quant Mock Exam',
                description: 'Complete standardized timed assessment covering all 24 canonical topics.',
                mode: 'standard',
                totalDurationMinutes: 30,
                status: 'published',
                createdAt: new Date().toISOString(),
                sections: [
                  {
                    sectionId: 'sec-1',
                    name: 'Quantitative Reasoning',
                    title: 'Quantitative Reasoning',
                    questionCount: 2,
                    durationMinutes: 30,
                    timeLimitMinutes: 30,
                    status: 'pending',
                  },
                ],
              },
            ],
          }),
        });
      }

      if ((path === '/api/v1/mock/sessions' || path === '/api/v1/mock-sessions') && method === 'POST') {
        const sessId = 'mock-session-e2e-777';
        apiState.mockSessions.set(sessId, {
          sessionId: sessId,
          status: 'created',
          currentSectionId: 'sec-1',
          answers: {},
        });

        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: sessId,
              sessionId: sessId,
              userId: 'user-e2e-123',
              blueprintId: 'bp-quant-full-01',
              status: 'created',
              navigationPolicy: 'free',
              currentSectionId: 'sec-1',
              responsesFrozen: false,
              finalizationState: 'idle',
              createdAt: new Date().toISOString(),
              sections: [
                {
                  sectionId: 'sec-1',
                  name: 'Quantitative Reasoning',
                  durationMinutes: 30,
                  status: 'pending',
                  questionCount: 2,
                },
              ],
            },
          }),
        });
      }

      if ((path.includes('/mock/sessions/') || path.includes('/mock-sessions/')) && path.endsWith('/start') && method === 'POST') {
        const parts = path.split('/');
        const sessId = parts[parts.length - 2];
        const sess = apiState.mockSessions.get(sessId) || {
          sessionId: sessId,
          status: 'created',
          answers: {},
        };
        sess.status = 'started';
        apiState.mockSessions.set(sessId, sess);

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: sessId,
              sessionId: sessId,
              userId: 'user-e2e-123',
              blueprintId: 'bp-quant-full-01',
              status: 'started',
              navigationPolicy: 'free',
              currentSectionId: 'sec-1',
              responsesFrozen: false,
              finalizationState: 'idle',
              createdAt: new Date().toISOString(),
              startedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 1800000).toISOString(),
              sections: [
                {
                  sectionId: 'sec-1',
                  name: 'Quantitative Reasoning',
                  durationMinutes: 30,
                  status: 'in_progress',
                  questionCount: 2,
                },
              ],
            },
          }),
        });
      }

      if (
        (path.includes('/mock/sessions/') || path.includes('/mock-sessions/')) &&
        path.includes('/questions/') &&
        method === 'GET'
      ) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              questionId: 'q-1',
              sectionId: 'sec-1',
              order: 1,
              question: 'Mock Question 1: If 2X + 5 = 15, what is X?',
              options: ['3', '5', '7', '10'],
              topic: 'Algebra',
              pattern: 'Linear Equations',
              difficulty: 2,
            },
          }),
        });
      }

      if (
        (path.includes('/mock/sessions/') || path.includes('/mock-sessions/')) &&
        (path.endsWith('/responses') || path.endsWith('/save-response')) &&
        method === 'POST'
      ) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'Response recorded.' },
          }),
        });
      }

      if (
        (path.includes('/mock/sessions/') || path.includes('/mock-sessions/')) &&
        path.endsWith('/submit') &&
        method === 'POST'
      ) {
        const parts = path.split('/');
        const sessId = parts[parts.length - 2];
        const sess = apiState.mockSessions.get(sessId);
        if (sess) sess.status = 'submitted';

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: sessId,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
          }),
        });
      }

      if (
        (path.includes('/mock/sessions/') || path.includes('/mock-sessions/')) &&
        path.endsWith('/abandon') &&
        method === 'POST'
      ) {
        const parts = path.split('/');
        const sessId = parts[parts.length - 2];
        const sess = apiState.mockSessions.get(sessId);
        if (sess) sess.status = 'abandoned';

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: sessId,
              status: 'abandoned',
              abandonedAt: new Date().toISOString(),
            },
          }),
        });
      }

      if (
        (path.includes('/mock/sessions/') || path.includes('/mock-sessions/')) &&
        path.endsWith('/result') &&
        method === 'GET'
      ) {
        const parts = path.split('/');
        const sessId = parts[parts.length - 2];
        const sess = apiState.mockSessions.get(sessId);

        if (sess?.status === 'abandoned' || sessId.includes('abandoned')) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { code: 'SESSION_ABANDONED', message: 'Exam was abandoned.' },
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: sessId,
              blueprintTitle: 'Full-Length Quant Mock Exam',
              totalScore: 100,
              maxScore: 100,
              percentage: 100,
              percentile: 95,
              accuracy: 1.0,
              totalTimeSpentSeconds: 120,
              completedAt: new Date().toISOString(),
              sectionScores: [
                {
                  sectionId: 'sec-1',
                  title: 'Quantitative Reasoning',
                  score: 100,
                  maxScore: 100,
                  accuracy: 1.0,
                  correctCount: 2,
                  totalQuestions: 2,
                },
              ],
            },
          }),
        });
      }

      if (
        (path.includes('/mock/sessions/') || path.includes('/mock-sessions/')) &&
        path.endsWith('/review') &&
        method === 'GET'
      ) {
        const parts = path.split('/');
        const sessId = parts[parts.length - 2];
        const sess = apiState.mockSessions.get(sessId);

        if (sess?.status === 'abandoned' || sessId.includes('abandoned')) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { code: 'SESSION_ABANDONED', message: 'Exam was abandoned.' },
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: sessId,
              blueprintTitle: 'Full-Length Quant Mock Exam',
              questions: [
                {
                  _id: 'q-mock-01',
                  question: 'Mock Question 1: If 2X + 5 = 15, what is X?',
                  options: ['3', '5', '7', '10'],
                  studentAnswer: '5',
                  correctAnswer: '5',
                  isCorrect: true,
                  timeTakenSeconds: 32,
                  explanation: 'Subtract 5: 2X = 10, X = 5.',
                  topic: 'Algebra',
                  pattern: 'Linear Equations',
                },
              ],
            },
          }),
        });
      }

      // Base session detail route: GET /api/v1/mock-sessions/:id
      if (
        (path.startsWith('/api/v1/mock/sessions/') || path.startsWith('/api/v1/mock-sessions/')) &&
        method === 'GET'
      ) {
        const parts = path.split('/');
        const sessId = parts[parts.length - 1];

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: sessId,
              sessionId: sessId,
              userId: 'user-e2e-123',
              blueprintId: 'bp-quant-full-01',
              status: 'started',
              navigationPolicy: 'free',
              currentSectionId: 'sec-1',
              responsesFrozen: false,
              finalizationState: 'idle',
              createdAt: new Date().toISOString(),
              startedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 1800000).toISOString(),
              sections: [
                {
                  sectionId: 'sec-1',
                  name: 'Quantitative Reasoning',
                  durationMinutes: 30,
                  status: 'in_progress',
                  questionCount: 2,
                },
              ],
            },
          }),
        });
      }

      // ── Operations 49–52: Analytics API ───────────────────────────────────
      if (path === '/api/v1/analytics/dashboard' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              overallAccuracy: 88,
              totalQuestionsAttempted: 120,
              topicMasteryRadar: [
                { topic: 'Arithmetic', masteryScore: 90 },
                { topic: 'Algebra', masteryScore: 82 },
                { topic: 'Geometry', masteryScore: 78 },
              ],
              speedAccuracyQuadrant: 'accurateAndFast',
              retentionIndex: 92,
            },
          }),
        });
      }

      if (path === '/api/v1/analytics/cognitive-profile' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              userId: 'user-e2e-123',
              algorithmVersion: 'v1.0.0',
              analysisWindow: { windowDays: 30, attemptsAnalyzed: 120 },
              speedAccuracyMatrix: {
                quadrantCounts: {
                  accurateAndFast: 65,
                  accurateAndSlow: 25,
                  fastErrorRushing: 18,
                  slowErrorStruggling: 12,
                },
                insufficientBaselineCount: 0,
                rushingRiskScore: 0.15,
                medianTimeCorrectSeconds: 32,
                medianTimeIncorrectSeconds: 48,
              },
              staminaCurve: {
                mockSessionsAnalyzed: 3,
                totalQuestionsAnalyzed: 60,
                quartileAccuracy: [
                  { quartile: 1, accuracy: 0.95, totalQuestions: 15, correctQuestions: 14 },
                  { quartile: 2, accuracy: 0.88, totalQuestions: 15, correctQuestions: 13 },
                  { quartile: 3, accuracy: 0.82, totalQuestions: 15, correctQuestions: 12 },
                  { quartile: 4, accuracy: 0.75, totalQuestions: 15, correctQuestions: 11 },
                ],
                fatigueDropoffPercent: 20,
              },
              staminaReason: null,
            },
          }),
        });
      }

      if (path === '/api/v1/analytics/retention' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentState: {
                stageDistribution: {
                  stage0_1day: 4,
                  stage1_3days: 8,
                  stage2_7days: 12,
                  stage3_16days: 15,
                  stage4_35days: 20,
                },
                totalTrackedPatterns: 59,
              },
              observedRetentionByGap: [
                { gapBucket: '1 day', totalEvents: 30, correctEvents: 28, observedRetentionRate: 0.93 },
                { gapBucket: '3 days', totalEvents: 25, correctEvents: 22, observedRetentionRate: 0.88 },
                { gapBucket: '7 days', totalEvents: 20, correctEvents: 17, observedRetentionRate: 0.85 },
              ],
              evidence: {
                totalRevisionEventsAnalyzed: 75,
                revisionAttemptsAnalyzed: 75,
                excludedNoPriorAttemptCount: 0,
                excludedShortGapCount: 0,
                excludedInvalidChronologyCount: 0,
              },
            },
          }),
        });
      }

      if (path.startsWith('/api/v1/analytics/readiness/') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              goalId: 'goal-primary-001',
              goalTitle: 'Target 99th Percentile Quant',
              targetDate: new Date(Date.now() + 86400000 * 30).toISOString(),
              algorithmVersion: 'v1.0.0',
              readinessStatus: 'calculated',
              readinessScore: 88,
              components: {
                planTargetCoverage: 92,
                masteryDepth: 85,
                eligibleMockPerformance: 90,
                eligibleMockPacing: 86,
              },
              criticalPrerequisiteBottlenecks: [],
            },
          }),
        });
      }

      // If unmatched API route, abort to guarantee isolation from external network
      return route.abort('failed');
    });

    await use(page);

    // Teardown route interception
    await page.unroute('**/api/v1/**');
  },
});

export { expect };
