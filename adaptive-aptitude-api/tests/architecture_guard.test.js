'use strict';

/**
 * tests/architecture_guard.test.js
 *
 * Repository-wide guards to guarantee architectural integrity:
 *  1. Section 10: Zero active legacy architecture (mentor, mentee, teacher)
 *  2. Section 11: Zero premature Phase 3+ implementation (User, Goal, StudyPlan,
 *                 DailyObjective, Attempt, StudentProgress, adaptiveEngine, etc.)
 *  3. Section 17: Topic distribution sum invariant: sum(all topic counts) === 12,000
 */

const fs = require('fs');
const path = require('path');
const registry = require('../src/data/canonicalPatternRegistry.json');

const getSourceFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getSourceFiles(fullPath, fileList);
      }
    } else if (file.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
};

describe('Architecture Guardrails', () => {
  const rootDir = path.resolve(__dirname, '..');
  const srcFiles = getSourceFiles(path.join(rootDir, 'src'));
  const scriptFiles = getSourceFiles(path.join(rootDir, 'scripts'));
  const testFiles = getSourceFiles(path.join(rootDir, 'tests'));
  const allCodeFiles = [...srcFiles, ...scriptFiles, ...testFiles];

  describe('Section 10: Legacy Architecture Scan', () => {
    const legacyPatterns = [
      /\bmentor\b/i,
      /\bmentee\b/i,
      /\bmentorPost\b/i,
      /\bmentorPosts\b/i,
      /\bmentorId\b/i,
      /\bmenteeId\b/i,
      /\bassignedMentor\b/i,
      /\bteacher\b/i,
      /\bteacherId\b/i,
      /\bassignedTeacher\b/i,
      /\bteacherDashboard\b/i,
      /\bteacherStudents\b/i,
    ];

    it('confirms zero active code references to legacy concepts across src/', () => {
      let activeReferences = 0;
      const findings = [];

      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, lineNum) => {
          const trimmed = line.trim();
          // Exclude comments that explicitly state exclusion
          if (
            trimmed.startsWith('//') ||
            trimmed.startsWith('*') ||
            trimmed.startsWith('/*')
          ) {
            return;
          }

          for (const pattern of legacyPatterns) {
            if (pattern.test(line)) {
              activeReferences++;
              findings.push(`${file}:${lineNum + 1}: ${line.trim()}`);
            }
          }
        });
      }

      if (findings.length > 0) {
        console.error('Active legacy references detected:', findings);
      }
      expect(activeReferences).toBe(0);
    });

    it('confirms zero active code references to legacy concepts across scripts/', () => {
      let activeReferences = 0;
      const findings = [];

      for (const file of scriptFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, lineNum) => {
          const trimmed = line.trim();
          if (
            trimmed.startsWith('//') ||
            trimmed.startsWith('*') ||
            trimmed.startsWith('/*')
          ) {
            return;
          }

          for (const pattern of legacyPatterns) {
            if (pattern.test(line)) {
              activeReferences++;
              findings.push(`${file}:${lineNum + 1}: ${line.trim()}`);
            }
          }
        });
      }

      expect(activeReferences).toBe(0);
    });
  });

  describe('Section 11: Phase 7+ Boundary Verification', () => {
    it('confirms src/models/ contains exactly Phase 1-6 models (no Phase 7+ leakage)', () => {
      const modelsDir = path.join(rootDir, 'src', 'models');
      const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'));

      // All 16 expected models across Phases 1-14
      const EXPECTED_MODELS = [
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
      ];
      const fileSet = new Set(files);
      for (const expected of EXPECTED_MODELS) {
        expect(fileSet.has(expected)).toBe(true);
      }
      expect(files.length).toBe(16);

      // No premature Phase 7+ model files should exist
      const forbiddenModels = ['llmSessionModel', 'misconceptionModel', 'proctoringModel', 'rankingModel'];
      for (const fm of forbiddenModels) {
        const found = files.find((f) => f.toLowerCase().includes(fm.toLowerCase()));
        expect(found).toBeUndefined();
      }
    });

    it('confirms absence of Phase 7+ services (llm tutoring, semantic misconception, proctoring, rankings)', () => {
      const servicesDir = path.join(rootDir, 'src', 'services');
      const files = getSourceFiles(servicesDir);

      // These are Phase 7+ services that must NOT exist in Phase 6
      const forbiddenServices = [
        'llmTutor',
        'llmService',
        'misconceptionService',
        'semanticMisconception',
        'proctoringService',
        'rankingService',
      ];

      for (const forbidden of forbiddenServices) {
        const match = files.find((f) => f.toLowerCase().includes(forbidden.toLowerCase()));
        expect(match).toBeUndefined();
      }
    });

    it('confirms zero active instantiations of Phase 7+ model names in src/', () => {
      const phase7ModelPatterns = [
        /\bLlmSessionModel\b/,
        /\bMisconceptionModel\b/,
        /\bProctoringModel\b/,
      ];

      let prematureRefs = 0;
      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of phase7ModelPatterns) {
          if (pattern.test(content)) prematureRefs++;
        }
      }
      expect(prematureRefs).toBe(0);
    });
  });

  describe('Section 17: Topic question count sum invariant', () => {
    it('confirms registry totalQuestions sum to exactly 12,000', () => {
      const totalQuestions = registry.reduce((sum, t) => sum + (t.totalQuestions || 0), 0);
      expect(totalQuestions).toBe(12000);
    });

    it('confirms unequal per-topic counts are maintained as verified', () => {
      const topicCounts = {};
      registry.forEach((t) => {
        topicCounts[t.topic] = t.totalQuestions;
      });

      // Confirm specific non-500 topics
      expect(topicCounts['Problems on Ages']).toBe(591);
      expect(topicCounts['Ratio and Proportion']).toBe(350);
      expect(topicCounts['Pipes and Cisterns']).toBe(610);
      expect(topicCounts['Time and Work']).toBe(440);
      expect(topicCounts['Time, Speed and Distance']).toBe(400);
      expect(topicCounts['Average']).toBe(459);
      expect(topicCounts['Percentage']).toBe(492);
      expect(topicCounts['Volume and Surface Area']).toBe(450);
      expect(topicCounts['Mixture and Alligation']).toBe(558);
      expect(topicCounts['Boats and Streams']).toBe(550);
      expect(topicCounts['Partnership']).toBe(550);
      expect(topicCounts['Problems on Trains']).toBe(550);
    });
  });

  describe('Phase 12 Architecture Guard: OrchestrationPolicyVersion Sole-Writer Enforcement', () => {
    const guardedFiles = [...srcFiles, ...scriptFiles];

    it('proves zero production or script files outside policyGovernanceService import orchestrationPolicyVersionModel', () => {
      const importRegex = /(?:require\s*\(|from\s*|import\s*\()\s*['"][^'"]*\/orchestrationPolicyVersionModel(?:\.js)?['"]/;
      const tokenRegex = /\borchestrationPolicyVersionModel\b/;
      const violations = [];

      for (const file of guardedFiles) {
        if (file.endsWith('orchestrationPolicyVersionModel.js')) continue;
        if (file.endsWith('policyGovernanceService.js')) continue;

        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
          if (importRegex.test(trimmed) || tokenRegex.test(trimmed)) {
            violations.push(`${file}:${idx + 1}: ${trimmed}`);
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Phase 13 Architecture Guard: Reliability, Observability & Production Hardening', () => {
    it('proves Mongoose model count remains strictly 16', () => {
      const modelsDir = path.join(rootDir, 'src', 'models');
      const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'));
      expect(files.length).toBe(16);
    });

    it('proves MongoDB collections invariant remains strictly 16', () => {
      const { EXPECTED_COLLECTIONS } = require('../scripts/diagnoseSystem');
      expect(EXPECTED_COLLECTIONS.length).toBe(16);
      const uniqueCollections = new Set(EXPECTED_COLLECTIONS);
      expect(uniqueCollections.size).toBe(16);
    });

    it('proves zero telemetry database writes across Phase 13 modules', () => {
      const telemetryFiles = [
        path.join(rootDir, 'src', 'utils', 'logger.js'),
        path.join(rootDir, 'src', 'utils', 'metrics.js'),
        path.join(rootDir, 'src', 'utils', 'requestContext.js'),
        path.join(rootDir, 'src', 'middleware', 'correlationMiddleware.js'),
        path.join(rootDir, 'src', 'middleware', 'metricsMiddleware.js'),
        path.join(rootDir, 'src', 'services', 'healthService.js')
      ];

      const writeMethods = [
        /\.save\s*\(/,
        /\.create\s*\(/,
        /\.updateOne\s*\(/,
        /\.updateMany\s*\(/,
        /\.deleteOne\s*\(/,
        /\.deleteMany\s*\(/,
        /\.bulkWrite\s*\(/,
        /\.findOneAndUpdate\s*\(/,
        /\.findOneAndDelete\s*\(/
      ];

      for (const file of telemetryFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of writeMethods) {
          expect(pattern.test(content)).toBe(false);
        }
      }
    });

    it('proves zero forbidden high-cardinality metric labels in metrics configuration', () => {
      const metricsFile = path.join(rootDir, 'src', 'utils', 'metrics.js');
      const content = fs.readFileSync(metricsFile, 'utf8');

      const forbiddenLabels = [
        'userId',
        'goalId',
        'attemptId',
        'questionId',
        'prescriptionId',
        'correlationId',
        'policyFingerprint'
      ];

      for (const label of forbiddenLabels) {
        expect(content).not.toContain(`'${label}'`);
        expect(content).not.toContain(`"${label}"`);
      }
    });

    it('proves diagnostic CLI does not import orchestrationPolicyVersionModel', () => {
      const cliFile = path.join(rootDir, 'scripts', 'diagnoseSystem.js');
      const content = fs.readFileSync(cliFile, 'utf8');
      expect(content).not.toMatch(/orchestrationPolicyVersionModel/);
    });

    it('proves zero uninventoried health or metrics controllers in src/controllers', () => {
      const controllersDir = path.join(rootDir, 'src', 'controllers');
      if (fs.existsSync(controllersDir)) {
        const files = fs.readdirSync(controllersDir);
        for (const file of files) {
          expect(file.toLowerCase()).not.toContain('health');
          expect(file.toLowerCase()).not.toContain('metric');
        }
      }
    });

    it('proves zero dependency growth in package.json', () => {
      const pkgPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      const forbiddenDeps = [
        'winston',
        'pino',
        'morgan',
        'bunyan',
        'prom-client',
        'node-cache'
      ];

      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {})
      };

      for (const dep of forbiddenDeps) {
        expect(allDeps[dep]).toBeUndefined();
      }
    });
  });
});

