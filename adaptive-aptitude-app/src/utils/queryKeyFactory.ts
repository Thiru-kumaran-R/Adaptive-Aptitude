// src/utils/queryKeyFactory.ts
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  questions: {
    all: ['questions'] as const,
    topics: () => ['questions', 'topics'] as const,
    patterns: (topic: string) => ['questions', 'patterns', topic] as const,
    topicPatterns: (topic: string) => ['questions', 'topic', topic, 'patterns'] as const,
    topicList: (topic: string, filters?: Record<string, unknown>) => ['questions', 'topic', topic, filters ?? {}] as const,
    patternList: (topic: string, pattern: string, filters?: { page?: number; limit?: number; difficulty?: number }) => ['questions', 'pattern', topic, pattern, filters ?? {}] as const,
    detail: (id: string) => ['questions', 'detail', id] as const,
  },
  user: {
    all: ['user'] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
  },
  goals: {
    all: ['goals'] as const,
    list: (userId: string) => ['goals', 'user', userId] as const,
    user: (userId: string) => ['goals', 'user', userId] as const,
    detail: (id: string) => ['goals', 'detail', id] as const,
  },
  planning: {
    all: ['planning'] as const,
    schedule: (planId: string) => ['planning', 'schedule', planId] as const,
    userPlans: (userId: string) => ['planning', 'plans', userId] as const,
    dailyObjectives: (userId: string, filters?: Record<string, unknown>) => ['planning', 'dailyObjectives', userId, filters ?? {}] as const,
  },
  plans: {
    all: ['planning'] as const,
  },
  attempts: {
    all: ['attempts'] as const,
    userHistory: (userId: string, filters?: Record<string, unknown>) => ['attempts', 'user', userId, filters ?? {}] as const,
  },
  progress: {
    all: ['progress'] as const,
    overall: (userId: string, filters?: Record<string, unknown>) => ['progress', 'overall', userId, filters ?? {}] as const,
    topics: (userId: string, topic?: string) => ['progress', 'topics', userId, topic ?? 'all'] as const,
    patterns: (userId: string, topic: string) => ['progress', 'patterns', userId, topic] as const,
    weakest: (userId: string, filters?: { topic?: string; limit?: number }) => ['progress', 'weakest', userId, filters ?? {}] as const,
    prerequisites: (patternName: string) => ['progress', 'prerequisites', patternName] as const,
  },
  adaptive: {
    all: ['adaptive'] as const,
    next: () => ['adaptive', 'next-question'] as const,
    nextQuestion: (params?: Record<string, unknown>) => ['adaptive', 'nextQuestion', params ?? {}] as const,
  },
  revisions: {
    all: ['revisions'] as const,
    due: (params?: Record<string, unknown>) => (params ? ['revisions', 'due', params] as const : ['revisions', 'due'] as const),
    plan: (days: 1 | 2, params?: Record<string, unknown>) => ['revisions', 'plan', days, params ?? {}] as const,
  },
  mock: {
    all: ['mock'] as const,
    blueprints: () => ['mock', 'blueprints'] as const,
    session: (id: string) => ['mock', 'session', id] as const,
    question: (sessionId: string, questionId: string) => ['mock', 'session', sessionId, 'question', questionId] as const,
    result: (sessionId: string) => ['mock', 'result', sessionId] as const,
    review: (sessionId: string) => ['mock', 'review', sessionId] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    dashboard: (userId?: string) => (userId ? ['analytics', 'dashboard', userId] as const : ['analytics', 'dashboard'] as const),
    cognitiveProfile: (userId?: string, params?: { windowDays?: number; topic?: string }) => (userId ? ['analytics', 'cognitiveProfile', userId, params ?? {}] as const : ['analytics', 'cognitiveProfile'] as const),
    retention: (userId?: string) => (userId ? ['analytics', 'retention', userId] as const : ['analytics', 'retention'] as const),
    readiness: (userId: string, goalId?: string) => (goalId ? ['analytics', 'readiness', userId, goalId] as const : ['analytics', 'readiness', userId] as const),
  },
  orchestration: {
    all: ['orchestration'] as const,
    nextAction: (userId: string, goalId?: string) => ['orchestration', 'next-action', userId, goalId ?? 'none'] as const,
    dailyAgenda: (userId: string, goalId?: string) => ['orchestration', 'dailyAgenda', userId, goalId ?? 'none'] as const,
    interventions: (userId: string, goalId?: string) => ['orchestration', 'interventions', userId, goalId ?? 'none'] as const,
  },
};
