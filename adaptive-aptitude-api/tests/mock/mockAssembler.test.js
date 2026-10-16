'use strict';

/**
 * tests/mock/mockAssembler.test.js
 *
 * Comprehensive tests for Phase 6 Question Assembler & Allocation Engine:
 * - Standard mode largest-remainder allocation
 * - Diagnostic mode 4-bucket ranking & 5-tier comparator
 * - New-student diagnostic guarantee
 * - Deterministic replay guarantee (seeded Fisher-Yates PRNG)
 * - Strict session-wide question uniqueness invariant
 * - Overlapping section scopes duplication elimination
 * - Recent question exclusion (bounded at 50 attempts)
 * - Shortfall safety (400 INSUFFICIENT_QUESTIONS_FOR_MOCK, zero silent relaxation)
 */

const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const Question = require('../../src/models/questionModel');
const Attempt = require('../../src/models/attemptModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const User = require('../../src/models/userModel');
const {
  allocateLargestRemainder,
  comparePatternsInBucket,
  allocatePatternsForSection,
  assembleMockSessionQuestions,
  createPrng,
  seededShuffle,
} = require('../../src/services/mock/mockAssemblerService');
const { seedMockQuestions, createTestUser } = require('../helpers/mockTestHelpers');
const { MOCK_MODES, NAVIGATION_POLICIES } = require('../../src/config/mockConfig');

describe('Phase 6: Deterministic Question Assembler & Allocation', () => {
  const userId = 'assembler-test-user-1';

  beforeAll(async () => {
    await connectTestDB();
    await createTestUser(userId);
  });

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
    await createTestUser(userId);
  });

  describe('Largest-Remainder Integer Allocation', () => {
    it('accurately divides question counts using largest remainder', () => {
      // 10 questions with 30% / 50% / 20%
      const weights = [0.30, 0.50, 0.20];
      const alloc = allocateLargestRemainder(10, weights);
      expect(alloc).toEqual([3, 5, 2]);
      expect(alloc.reduce((s, n) => s + n, 0)).toBe(10);
    });

    it('handles odd question counts deterministically', () => {
      // 7 questions with 30% / 50% / 20% -> 2.1, 3.5, 1.4 -> int: 2, 3, 1 (sum=6, rem=1). Remainder 0.5 is largest -> [2, 4, 1]
      const weights = [0.30, 0.50, 0.20];
      const alloc = allocateLargestRemainder(7, weights);
      expect(alloc).toEqual([2, 4, 1]);
      expect(alloc.reduce((s, n) => s + n, 0)).toBe(7);
    });
  });

  describe('Diagnostic 4-Bucket & 5-Tier Comparator', () => {
    it('correctly sorts patterns using the 5-tier comparator', () => {
      const p1 = { pattern: 'Pat A', mastery: 0.2, attempts: 5, registryIndex: 10 };
      const p2 = { pattern: 'Pat B', mastery: 0.1, attempts: 2, registryIndex: 20 };
      const p3 = { pattern: 'Pat C', mastery: 0.2, attempts: 2, registryIndex: 30 };
      const p4 = { pattern: 'Pat D', mastery: 0.2, attempts: 2, registryIndex: 5 };

      // Lower mastery first: p2 (0.1) < p1, p3, p4 (0.2)
      expect(comparePatternsInBucket(p2, p1)).toBeLessThan(0);

      // Same mastery (0.2): fewer attempts first -> p3, p4 (2 att) < p1 (5 att)
      expect(comparePatternsInBucket(p3, p1)).toBeLessThan(0);

      // Same mastery (0.2) and same attempts (2): lower registry index first -> p4 (idx 5) < p3 (idx 30)
      expect(comparePatternsInBucket(p4, p3)).toBeLessThan(0);
    });

    it('new-student guarantee: zero progress records classifies 100% of patterns as Unseen', async () => {
      const section = {
        sectionId: 'sec-diag',
        questionCount: 4,
        scope: {
          patterns: [
            'Successive Percentage Changes',
            'Basic Percentage Calculation',
            'Basic Arithmetic Mean & Missing Observations',
            'Weighted Average & Alligation',
          ],
        },
      };

      const allocations = await allocatePatternsForSection({
        section,
        mode: MOCK_MODES.DIAGNOSTIC,
        userId: 'brand-new-student-zero-progress',
      });

      expect(allocations).toHaveLength(4);
      for (const a of allocations) {
        expect(a.diagnosticBucket).toBe('Unseen');
        expect(a.mastery).toBe(0);
        expect(a.attempts).toBe(0);
        expect(a.questionCount).toBe(1);
      }
    });

    it('diagnostic mode partitions into Weak, Unseen, Developing, Mastered in priority order', async () => {
      // Seed progress:
      // Pattern 1: Weak (attempts: 3, mastery: 0.40)
      // Pattern 2: Developing (attempts: 5, mastery: 0.75)
      // Pattern 3: Mastered (attempts: 10, mastery: 0.90)
      // Pattern 4: Unseen (no progress doc)
      await StudentProgress.create([
        {
          userId,
          topic: 'Percentage',
          pattern: 'Successive Percentage Changes',
          attempts: 3,
          mastery: 0.40,
        },
        {
          userId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          attempts: 5,
          mastery: 0.75,
        },
        {
          userId,
          topic: 'Average',
          pattern: 'Basic Arithmetic Mean & Missing Observations',
          attempts: 10,
          mastery: 0.90,
        },
      ]);

      const section = {
        sectionId: 'sec-diag-buckets',
        questionCount: 4,
        scope: {
          patterns: [
            'Basic Arithmetic Mean & Missing Observations', // Mastered
            'Weighted Average & Alligation', // Unseen
            'Successive Percentage Changes', // Weak
            'Basic Percentage Calculation', // Developing
          ],
        },
      };

      const allocations = await allocatePatternsForSection({
        section,
        mode: MOCK_MODES.DIAGNOSTIC,
        userId,
      });

      // Priority order: Weak, Unseen, Developing, Mastered
      expect(allocations[0].pattern).toBe('Successive Percentage Changes');
      expect(allocations[0].diagnosticBucket).toBe('Weak');

      expect(allocations[1].pattern).toBe('Weighted Average & Alligation');
      expect(allocations[1].diagnosticBucket).toBe('Unseen');

      expect(allocations[2].pattern).toBe('Basic Percentage Calculation');
      expect(allocations[2].diagnosticBucket).toBe('Developing');

      expect(allocations[3].pattern).toBe('Basic Arithmetic Mean & Missing Observations');
      expect(allocations[3].diagnosticBucket).toBe('Mastered');
    });
  });

  describe('Deterministic Replay & Seeded PRNG', () => {
    it('produces identical shuffled sequences with same seed', () => {
      const items = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'];
      const seed = 'test-seed-42';

      const prng1 = createPrng(seed);
      const prng2 = createPrng(seed);

      const shuffled1 = seededShuffle(items, prng1);
      const shuffled2 = seededShuffle(items, prng2);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('produces different shuffled sequences with different seeds', () => {
      const items = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'];
      const prngA = createPrng('seed-alpha');
      const prngB = createPrng('seed-beta');

      const shuffledA = seededShuffle(items, prngA);
      const shuffledB = seededShuffle(items, prngB);

      expect(shuffledA).not.toEqual(shuffledB);
    });
  });

  describe('Strict Session-Wide Question Uniqueness & Shortfall Safety', () => {
    beforeEach(async () => {
      await Question.deleteMany({});
      // Seed 5 questions per band for Successive Percentage Changes (15 total)
      await seedMockQuestions({
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
        countPerBand: 5,
      });
      // Seed 5 questions per band for Basic Arithmetic Mean (15 total)
      await seedMockQuestions({
        topic: 'Average',
        pattern: 'Basic Arithmetic Mean & Missing Observations',
        countPerBand: 5,
      });
    });

    it('maintains strict uniqueness across sections with overlapping scope', async () => {
      const blueprint = {
        title: 'Overlapping Scope Test',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        durationMinutes: 60,
        effectiveExcludeRecentQuestions: false,
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 4,
            scope: {
              patterns: ['Successive Percentage Changes'],
            },
          },
          {
            sectionId: 'sec-2',
            questionCount: 4,
            scope: {
              patterns: ['Successive Percentage Changes'], // Exact same pattern in section 2
            },
          },
        ],
      };

      const result = await assembleMockSessionQuestions({
        blueprint,
        userId,
        generationSeed: 'test-seed-unique-1',
      });

      expect(result.questionSequence).toHaveLength(8);
      const idSet = new Set(result.questionSequence.map((q) => q.questionId.toString()));
      // Zero duplicate questions across the entire session!
      expect(idSet.size).toBe(8);
    });

    it('replays the exact identical question sequence with same input state and seed', async () => {
      const blueprint = {
        title: 'Replay Test',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        durationMinutes: 60,
        effectiveExcludeRecentQuestions: false,
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 6,
            scope: {
              patterns: ['Successive Percentage Changes'],
            },
          },
        ],
      };

      const run1 = await assembleMockSessionQuestions({
        blueprint,
        userId,
        generationSeed: 'fixed-replay-seed-999',
      });

      const run2 = await assembleMockSessionQuestions({
        blueprint,
        userId,
        generationSeed: 'fixed-replay-seed-999',
      });

      expect(run1.questionSequence.map((q) => q.questionId.toString())).toEqual(
        run2.questionSequence.map((q) => q.questionId.toString())
      );
    });

    it('throws 400 INSUFFICIENT_QUESTIONS_FOR_MOCK when bank has shortage without silent relaxation', async () => {
      const blueprint = {
        title: 'Shortage Test',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        durationMinutes: 60,
        effectiveExcludeRecentQuestions: false,
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 100, // We only have 15 questions seeded!
            scope: {
              patterns: ['Successive Percentage Changes'],
            },
          },
        ],
      };

      await expect(
        assembleMockSessionQuestions({
          blueprint,
          userId,
          generationSeed: 'shortage-seed',
        })
      ).rejects.toThrow();

      try {
        await assembleMockSessionQuestions({
          blueprint,
          userId,
          generationSeed: 'shortage-seed',
        });
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INSUFFICIENT_QUESTIONS_FOR_MOCK');
      }
    });

    it('excludes recent questions up to limit 50 when enabled and throws if shortage occurs', async () => {
      const allSeeded = await Question.find({ pattern: 'Successive Percentage Changes' }).lean();

      // Create attempts for first 12 questions across diverse sources (practice, daily_plan, adaptive, revision, mock)
      const attemptsToCreate = allSeeded.slice(0, 12).map((q, idx) => ({
        userId,
        questionId: q._id,
        topic: q.topic,
        pattern: q.pattern,
        difficulty: q.difficulty,
        selectedAnswer: 'Option A',
        correctAnswer: 'Option A',
        isCorrect: true,
        timeTaken: 30,
        source: ['practice', 'daily_plan', 'adaptive', 'revision', 'mock'][idx % 5],
        attemptedAt: new Date(Date.now() - idx * 1000),
      }));
      await Attempt.insertMany(attemptsToCreate);

      // Now we only have 3 unattempted questions left (15 - 12 = 3)
      const blueprint = {
        title: 'Exclusion Shortage Test',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        durationMinutes: 60,
        effectiveExcludeRecentQuestions: true, // Exclusion active
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 6, // Requests 6, but only 3 are unattempted
            scope: {
              patterns: ['Successive Percentage Changes'],
            },
          },
        ],
      };

      try {
        await assembleMockSessionQuestions({
          blueprint,
          userId,
          generationSeed: 'exclusion-seed',
        });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INSUFFICIENT_QUESTIONS_FOR_MOCK');
      }
    });
  });
});
