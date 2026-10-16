// src/test/unit/queryKeyFactory.test.ts
import { describe, it, expect } from 'vitest';
import { queryKeys } from '../../utils/queryKeyFactory';

describe('queryKeyFactory (Centralized Query Keys)', () => {
  it('generates consistent deterministic query key arrays for all domains', () => {
    expect(queryKeys.auth.me()).toEqual(['auth', 'me']);
    expect(queryKeys.goals.user('user-1')).toEqual(['goals', 'user', 'user-1']);
    expect(queryKeys.questions.topics()).toEqual(['questions', 'topics']);
    expect(queryKeys.questions.patterns('Arithmetic')).toEqual([
      'questions',
      'patterns',
      'Arithmetic',
    ]);
    expect(queryKeys.adaptive.next()).toEqual(['adaptive', 'next-question']);
    expect(queryKeys.revisions.due()).toEqual(['revisions', 'due']);
    expect(queryKeys.mock.session('sess-1')).toEqual(['mock', 'session', 'sess-1']);
    expect(queryKeys.analytics.dashboard('user-1')).toEqual([
      'analytics',
      'dashboard',
      'user-1',
    ]);
    expect(queryKeys.orchestration.nextAction('user-1', 'goal-1')).toEqual([
      'orchestration',
      'next-action',
      'user-1',
      'goal-1',
    ]);
  });

  it('exposes valid prefix arrays for cache invalidation sweeps', () => {
    expect(queryKeys.goals.all).toEqual(['goals']);
    expect(queryKeys.questions.all).toEqual(['questions']);
    expect(queryKeys.plans.all).toEqual(['planning']);
    expect(queryKeys.attempts.all).toEqual(['attempts']);
    expect(queryKeys.progress.all).toEqual(['progress']);
    expect(queryKeys.revisions.all).toEqual(['revisions']);
    expect(queryKeys.mock.all).toEqual(['mock']);
    expect(queryKeys.analytics.all).toEqual(['analytics']);
    expect(queryKeys.orchestration.all).toEqual(['orchestration']);
  });
});
