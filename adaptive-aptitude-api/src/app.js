'use strict';

const crypto = require('node:crypto');
const express = require('express');
const cookieParser = require('cookie-parser');

const correlationMiddleware = require('./middleware/correlationMiddleware');
const { metricsMiddleware } = require('./middleware/metricsMiddleware');
const { securityHeadersMiddleware, corsMiddleware } = require('./middleware/securityHeaders');
const { globalRateLimiter, llmRateLimiter } = require('./middleware/rateLimiter');
const authenticate = require('./middleware/authenticate');
const { enforcePrincipalUserIdBodyQuery } = require('./middleware/authorize');
const healthService = require('./services/healthService');
const metrics = require('./utils/metrics');

// ── Auth routes (Phase 14) ───────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');

// ── Phase 2 routes ─────────────────────────────────────────────────────────
const questionRoutes = require('./routes/questionRoutes');

// ── Phase 3 routes ─────────────────────────────────────────────────────────
const userRoutes = require('./routes/userRoutes');
const goalRoutes = require('./routes/goalRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const dailyObjectiveRoutes = require('./routes/dailyObjectiveRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const progressRoutes = require('./routes/progressRoutes');

// ── Phase 4 routes ─────────────────────────────────────────────────────────
const adaptiveRoutes = require('./routes/adaptiveRoutes');

// ── Phase 5 routes ─────────────────────────────────────────────────────────
const planningRoutes = require('./routes/planningRoutes');
const revisionRoutes = require('./routes/revisionRoutes');

// ── Phase 6 routes ─────────────────────────────────────────────────────────
const mockBlueprintRoutes = require('./routes/mockBlueprintRoutes');
const mockSessionRoutes = require('./routes/mockSessionRoutes');

// ── Phase 7 routes ─────────────────────────────────────────────────────────
const learningRoutes = require('./routes/learningRoutes');

// ── Phase 8 routes ─────────────────────────────────────────────────────────
const analyticsRoutes = require('./routes/analyticsRoutes');

// ── Phase 9 routes ─────────────────────────────────────────────────────────
const orchestrationRoutes = require('./routes/orchestrationRoutes');

// ── Phase 10 routes ────────────────────────────────────────────────────────
const attributionRoutes = require('./routes/attributionRoutes');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const createApp = () => {
  const app = express();

  // Reverse proxy posture
  app.set('trust proxy', false);

  // 1. Phase 13 Correlation Context (FIRST global middleware)
  app.use(correlationMiddleware);

  // 2. Phase 13 Authoritative Request Tracking & Metrics Middleware
  app.use(metricsMiddleware);

  // 3. Security Headers Middleware (Stage 3)
  app.use(securityHeadersMiddleware);

  // 4. Health Probes (Stage 4 — bypass CORS, limiter, auth)
  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, status: 'ok' });
  });

  app.get('/health/live', async (_req, res) => {
    const result = healthService.evaluateLiveness();
    res.status(200).json(result);
  });

  app.get('/health/ready', async (_req, res) => {
    const result = await healthService.evaluateReadiness();
    res.status(result.statusCode).json(result.body);
  });

  // 5. Protected /metrics Route (Stage 5 — outside rate limiter and CORS)
  if (process.env.METRICS_ENABLED === 'true') {
    app.get('/metrics', (req, res) => {
      const scrapeSecret = process.env.METRICS_SCRAPE_SECRET;
      if (scrapeSecret) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Metrics scraper authentication required.'
            }
          });
        }
        const presentedSecret = authHeader.slice(7);
        const presentedBuf = Buffer.from(presentedSecret, 'utf8');
        const expectedBuf = Buffer.from(scrapeSecret, 'utf8');
        if (
          presentedBuf.length !== expectedBuf.length ||
          !crypto.timingSafeEqual(presentedBuf, expectedBuf)
        ) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid metrics scraper token.'
            }
          });
        }
      }

      const body = metrics.toPrometheusText();
      res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.status(200).end(body);
    });
  }

  // 6. Global IP Limiter (Stage 6)
  app.use(globalRateLimiter);

  // 7. Hardened CORS (Stage 7)
  app.use(corsMiddleware);

  // 8. Cookie Parser (Stage 8)
  app.use(cookieParser());

  // 9. Bounded JSON Parser (Stage 9)
  app.use(express.json({ limit: '100kb' }));

  // 10. Auth Router (Stage 10 — public endpoints before authenticate boundary)
  app.use('/api/v1/auth', authRoutes);

  // 11. Authenticate Boundary (Stage 11 — establishes req.user, tombstone bypass)
  app.use('/api/v1', authenticate);

  // 12. Tier-4 LLM Limiter for /api/v1/learning/* (Stage 12 — keyed by req.user.userId)
  app.use('/api/v1/learning', llmRateLimiter);

  // 13. Protected Business Stage (Stage 13)
  //   13a. Universal Body/Query Principal Guard
  app.use('/api/v1', enforcePrincipalUserIdBodyQuery);

  //   13b. Protected Business Routers
  app.use('/api/v1/questions', questionRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/goals', goalRoutes);
  app.use('/api/v1/study-plans', studyPlanRoutes);
  app.use('/api/v1/daily-objectives', dailyObjectiveRoutes);
  app.use('/api/v1/attempts', attemptRoutes);
  app.use('/api/v1/progress', progressRoutes);
  app.use('/api/v1/adaptive', adaptiveRoutes);
  app.use('/api/v1/planning', planningRoutes);
  app.use('/api/v1/revisions', revisionRoutes);
  app.use('/api/v1/mock-blueprints', mockBlueprintRoutes);
  app.use('/api/v1/mock-sessions', mockSessionRoutes);
  app.use('/api/v1/learning', learningRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/orchestration', orchestrationRoutes);
  app.use('/api/v1/attribution', attributionRoutes);

  // 14. 404 Handler (Stage 14)
  app.use(notFound);

  // 15. Centralized Error Handler (Stage 15 — MUST BE LAST)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
