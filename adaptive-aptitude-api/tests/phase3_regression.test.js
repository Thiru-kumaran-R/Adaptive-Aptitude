'use strict';

/**
 * tests/phase3_regression.test.js
 *
 * Phase 2 Regression + Phase Boundary Tests
 *
 * Verifies:
 *   - Phase 2 question APIs still work correctly after Phase 3 is added
 *   - Phase 3 models directory has ONLY Phase 3 models (no Phase 4 leakage)
 *   - Phase 4 concepts are NOT implemented (no adaptive selection, no mastery algo)
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const createApp = require('../src/app');
const { connectTestDB, disconnectTestDB, clearTestQuestions } = require('./helpers/dbSetup');
const { seedQuestions } = require('./helpers/seedData');
const { signAccessToken } = require('../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
  await seedQuestions();
});

afterAll(async () => {
  await clearTestQuestions();
  await disconnectTestDB();
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 Regression
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 2 Regression — Question APIs still work after Phase 3', () => {
  it('R1: GET /api/v1/questions/topic/Percentage returns Percentage questions', async () => {
    const res = await request(app)
      .get('/api/v1/questions/topic/Percentage')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((q) => q.topic === 'Percentage')).toBe(true);
  });

  it('R2: GET /api/v1/questions/topic/Algebra returns Algebra questions', async () => {
    const res = await request(app)
      .get('/api/v1/questions/topic/Algebra')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(res.body.data.every((q) => q.topic === 'Algebra')).toBe(true);
  });

  it('R3: GET /api/v1/questions/topic/Percentage/pattern/Basic%20Percentage%20Calculation returns pattern questions', async () => {
    const res = await request(app)
      .get('/api/v1/questions/topic/Percentage/pattern/Basic%20Percentage%20Calculation')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('R4: GET /api/v1/questions/topics returns registry topics', async () => {
    const res = await request(app)
      .get('/api/v1/questions/topics')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('R5: GET /health still works', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase Boundary — Models directory
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase Boundary — Models directory only has Phase 1–3 models', () => {
  const modelsDir = path.resolve(__dirname, '..', 'src', 'models');
  const ALLOWED_MODELS = new Set([
    'questionModel.js',
    'userModel.js',
    'goalModel.js',
    'studyPlanModel.js',
    'dailyObjectiveModel.js',
    'attemptModel.js',
    'studentProgressModel.js',
    'revisionItemModel.js',
    'revisionProcessingRecordModel.js',
    'mockBlueprintModel.js',
    'mockSessionModel.js',
    'mockResponseModel.js',
    'mockAttemptFinalizationRecordModel.js',
    'prescriptionExecutionRecordModel.js',
    'orchestrationPolicyVersionModel.js',
    'authSessionModel.js',
  ]);

  it('PB1: no unexpected model files exist in src/models/', () => {
    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'));
    const unexpected = files.filter((f) => !ALLOWED_MODELS.has(f));
    expect(unexpected).toEqual([]);
  });

  it('PB2: all 16 expected model files exist', () => {
    const files = new Set(fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js')));
    for (const expected of ALLOWED_MODELS) {
      expect(files.has(expected)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase Boundary — No Phase 4 concepts implemented (executable code scan)
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase Boundary — Phase 4 concepts NOT implemented in Phase 3', () => {
  /**
   * Scan only Phase 3 service files (not Phase 2 registry/question services).
   * Strip comments before scanning to avoid false positives from documentation.
   */
  const PHASE4_TERMS = [
    'masteryThreshold',
    'adaptiveSelect',
    'spacedRepetition',
    'mockTestAdapt',
    'LLMTutor',
    'autoReplan',
  ];

  const PHASE3_SERVICE_FILES = [
    'userService.js',
    'goalService.js',
    'studyPlanService.js',
    'dailyObjectiveService.js',
    'attemptService.js',
    'studentProgressService.js',
  ];

  const servicesDir = path.resolve(__dirname, '..', 'src', 'services');

  /**
   * Strip single-line and multi-line comments from JS content.
   */
  const stripComments = (code) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
      .replace(/\/\/[^\n]*/g, '');         // line comments
  };

  it('PB3: Phase 4 algorithm terms not present in Phase 3 service executable code', () => {
    const violations = [];
    for (const fileName of PHASE3_SERVICE_FILES) {
      const filePath = path.join(servicesDir, fileName);
      if (!fs.existsSync(filePath)) continue;
      const code = stripComments(fs.readFileSync(filePath, 'utf8'));
      for (const term of PHASE4_TERMS) {
        if (code.includes(term)) {
          violations.push({ file: fileName, term });
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('PB4: StudentProgress mastery field is NOT computed by Phase 3 progress updates', async () => {
    const StudentProgress = require('../src/models/studentProgressModel');
    const studentProgressService = require('../src/services/studentProgressService');
    await StudentProgress.deleteMany({ userId: 'pb4_test_user' });

    await studentProgressService.updateProgressFromAttempt({
      userId: 'pb4_test_user',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      isCorrect: true,
      timeTaken: 20,
      attemptedAt: new Date(),
    });

    const p = await StudentProgress.findOne({ userId: 'pb4_test_user' });
    expect(p.mastery).toBe(0);
    await StudentProgress.deleteMany({ userId: 'pb4_test_user' });
  });

  it('PB5: highestDifficultyMastered is NOT set by Phase 3 progress updates', async () => {
    const StudentProgress = require('../src/models/studentProgressModel');
    const studentProgressService = require('../src/services/studentProgressService');
    await StudentProgress.deleteMany({ userId: 'pb5_test_user' });

    await studentProgressService.updateProgressFromAttempt({
      userId: 'pb5_test_user',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      isCorrect: true,
      timeTaken: 20,
      attemptedAt: new Date(),
    });

    const p = await StudentProgress.findOne({ userId: 'pb5_test_user' });
    expect(p.highestDifficultyMastered).toBe(0);
    await StudentProgress.deleteMany({ userId: 'pb5_test_user' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase Boundary — Legacy architecture scan (Phase 3 models only)
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase Boundary — No legacy architecture in Phase 3 models', () => {
  // Scan only Phase 3 model files (not Phase 2 questionModel.js)
  const PHASE3_MODELS = [
    'userModel.js',
    'goalModel.js',
    'studyPlanModel.js',
    'dailyObjectiveModel.js',
    'attemptModel.js',
    'studentProgressModel.js',
  ];

  // These are the architectural patterns that must NOT appear as identifiers/keys
  // in Phase 3 model schema definitions (excludes comment-only mentions)
  const LEGACY_SCHEMA_TERMS = [
    'teacherId',
    'mentorId',
    'menteeId',
    'classroomId',
    'mentorPostId',
    'mentorAssignmentId',
    'teacherDashboard',
  ];

  const modelsDir = path.resolve(__dirname, '..', 'src', 'models');

  const stripComments = (code) =>
    code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

  it('PB6: Phase 3 model schemas do not contain legacy architecture field names', () => {
    const violations = [];
    for (const fileName of PHASE3_MODELS) {
      const filePath = path.join(modelsDir, fileName);
      if (!fs.existsSync(filePath)) continue;
      const code = stripComments(fs.readFileSync(filePath, 'utf8'));
      for (const term of LEGACY_SCHEMA_TERMS) {
        if (code.includes(term)) {
          violations.push({ file: fileName, term });
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
