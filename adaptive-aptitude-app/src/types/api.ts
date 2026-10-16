// src/types/api.ts
// Exhaustive, mechanically certified backend wire contracts for all 64 consumed operations.

// ── Generic API Envelopes & Metadata (BACKEND-PROVEN: src/utils/apiResponse.js) ────────────
export interface ApiSuccessEnvelope<T, M = unknown> {
  success: true;
  data: T;
  meta?: M;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  count: number;
}

export interface SuccessEnvelopeDto {
  message: string;
}

// ── Auth Wire DTOs & Responses (Operations 1–6) ───────────────────────────────────────────
// BACKEND-PROVEN: src/routes/authRoutes.js & src/controllers/authController.js
export interface AuthUserSummary {
  userId: string;
  name: string;
  email: string;
}

export interface UserProfileDto {
  userId: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  status: 'active' | 'disabled' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequestPayload {
  name: string;
  email: string;
  password: string;
}

// Op 1: POST /api/v1/auth/register (returns 201 with data: { user })
export interface RegisterResponseDto {
  user: AuthUserSummary;
}

export type AuthRegisterPayload = RegisterResponseDto;
export type AuthRegisterResponse = AuthRegisterWireResponse;
export type RegisterWireResponse = AuthRegisterWireResponse;
export type RegisterResponseWireResponse = AuthRegisterWireResponse;

export interface AuthRegisterWireResponse {
  success: true;
  data: RegisterResponseDto;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

// Op 2: POST /api/v1/auth/login (returns 200 with accessToken, expiresIn, user; HttpOnly cookie for refresh)
export interface LoginResponseDto {
  accessToken: string;
  expiresIn: number;
  user: AuthUserSummary;
}

export type AuthLoginPayload = LoginResponseDto;
export type AuthLoginResponse = AuthLoginWireResponse;
export type LoginWireResponse = AuthLoginWireResponse;

export interface AuthLoginWireResponse {
  success: true;
  data: LoginResponseDto;
}

// Op 3: POST /api/v1/auth/refresh (returns 200 with accessToken, expiresIn; HttpOnly cookie for refresh)
export interface RefreshTokenResponseDto {
  accessToken: string;
  expiresIn: number;
}

export type RefreshResponseDto = RefreshTokenResponseDto;
export type AuthRefreshPayload = RefreshTokenResponseDto;
export type AuthRefreshResponse = AuthRefreshWireResponse;
export type RefreshWireResponse = AuthRefreshWireResponse;

export interface AuthRefreshWireResponse {
  success: true;
  data: RefreshResponseDto;
}

// Op 4: POST /api/v1/auth/logout (requires authenticate middleware; clears refresh cookie)
export interface AuthLogoutWireResponse {
  success: true;
  data: {
    message: string;
  };
}

// Op 5: POST /api/v1/auth/revoke-all (requires authenticate middleware; clears refresh cookie)
export interface AuthRevokeAllWireResponse {
  success: true;
  data: {
    message: string;
  };
}

// Op 6: GET /api/v1/auth/me (requires authenticate middleware)
export interface AuthMeWireResponse {
  success: true;
  data: {
    user: UserProfileDto;
    session: {
      sessionId: string;
      issuedAt: string;
      expiresAt: string;
    };
  };
}

// ── Question Bank & Pattern Registry DTOs (Operations 7–13) ──────────────────────────────
// Op 7: GET /api/v1/questions/topics
export interface TopicListWireResponse {
  success: true;
  data: string[];
  meta: {
    count: number;
  };
}

export interface PatternSummaryDto {
  name: string;
  slug: string;
  description: string;
  questionCount: number;
  prerequisites: string[];
  aliases: string[];
}

export type PatternDto = PatternSummaryDto;

// Op 8: GET /api/v1/questions/topic/:topic/patterns
export interface PatternListWireResponse {
  success: true;
  data: PatternSummaryDto[];
  meta: {
    topic: string;
    count: number;
  };
}

export interface QuestionDto {
  _id: string;
  questionId?: string;
  topic: string;
  pattern: string;
  difficulty: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  metadata?: {
    estimatedTimeSeconds?: number;
    tags?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

// Ops 9 & 10: GET /api/v1/questions/topic/:topic & GET /api/v1/questions/pattern/:pattern
// Op 11 & 12: GET /api/v1/questions/topic/:topic/random & GET /api/v1/questions/topic/:topic/pattern/:pattern/random
export interface QuestionRandomListWireResponse {
  success: true;
  data: QuestionDto[];
  meta: {
    count: number;
  };
}

export interface QuestionPaginatedWireResponse {
  success: true;
  data: QuestionDto[];
  meta: PaginationMeta;
}

// Op 11: GET /api/v1/questions/:id
export interface QuestionDetailWireResponse {
  success: true;
  data: QuestionDto;
}

// Op 12: GET /api/v1/questions/practice
export interface PracticeSessionWireResponse {
  success: true;
  data: QuestionDto[];
  meta: {
    count: number;
  };
}

// Op 13: GET /api/v1/questions/details/:id
export interface QuestionWithExplanationDto extends QuestionDto {
  detailedExplanation?: string;
  conceptTakeaway?: string;
}

export interface QuestionExplanationWireResponse {
  success: true;
  data: QuestionWithExplanationDto;
}

// ── User Profile & Goal Management DTOs (Operations 14–19) ─────────────────────────────────
// Op 14: GET /api/v1/users/:id
export interface UserGetWireResponse {
  success: true;
  data: UserProfileDto;
}

export type UserProfileWireResponse = UserGetWireResponse;

export interface GoalDetailDto {
  _id: string;
  userId: string;
  title: string;
  type: string;
  targetName?: string;
  description?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  targetScore?: number | null;
  priority?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Op 15: GET /api/v1/goals/user/:userId
export interface GoalListWireResponse {
  success: true;
  data: GoalDetailDto[];
  meta: {
    count: number;
  };
}

// Op 16: POST /api/v1/goals (requires title and type; status accepted)
export interface GoalCreatePayload {
  title: string;
  type: string;
  targetName?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  targetScore?: number;
  priority?: string;
  status?: string;
}

export type GoalCreateRequestPayload = GoalCreatePayload;

export interface GoalCreateWireResponse {
  success: true;
  data: GoalDetailDto;
}

// Op 17: GET /api/v1/goals/:id
export interface GoalDetailWireResponse {
  success: true;
  data: GoalDetailDto;
}

// Op 18: PATCH /api/v1/goals/:id
export interface GoalPatchPayload {
  title?: string;
  type?: string;
  targetName?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  targetScore?: number;
  priority?: string;
  status?: string;
}

export type GoalPatchRequestPayload = GoalPatchPayload;

export interface GoalUpdateWireResponse {
  success: true;
  data: GoalDetailDto;
}

export type GoalPatchWireResponse = GoalUpdateWireResponse;

// Op 19: DELETE /api/v1/goals/:id (hard delete via Goal.deleteOne returning { deleted: true })
export interface GoalDeleteWireResponse {
  success: true;
  data: {
    deleted: true;
  };
}

// ── Planning & Study Plan Engine DTOs (Operations 20–26) ──────────────────────────────────
// Structured scope object supported by planningScopeService.js
export interface PlanningScopeDto {
  topics?: string[];
  patterns?: string[];
  allCanonicalPatterns?: boolean;
  targetProfileId?: string;
  includeMastered?: boolean;
}

// Op 20: POST /api/v1/planning/preview
export interface PlanPreviewPayload {
  goalId: string;
  scope: PlanningScopeDto;
  durationPreset?: '3d' | '7d' | '9d' | '1m' | '2m' | '3m' | '6m';
  startDate?: string;
  targetDate?: string;
  referenceDate?: string;
  dailyQuestionBudget?: number;
  dailyMinutes?: number;
  maxPatternsPerDay?: number;
  includeMastered?: boolean;
}

export type PlanPreviewRequestPayload = PlanPreviewPayload;

export interface PlanPreviewResultDto {
  algorithmVersion: string;
  startDate: string;
  endDate: string;
  days: number;
  durationPreset: string | null;
  dailyQuestionBudget: number;
  dailyMinutes: number;
  maxPatternsPerDay: number;
  patternsRequested: number;
  prerequisitesAdded: number;
  prerequisitesList: string[];
  patternsAlreadyMastered: number;
  patternsScheduled: number;
  patternsUnscheduled: number;
  unscheduledPatterns: string[];
  totalRequestedWorkload: number;
  horizonQuestionCapacity: number;
  scheduledWorkload: number;
  unscheduledWorkload: number;
  capacityShortfall: boolean;
  reasonCodes: string[];
  proposedTargets: Array<{
    topic: string;
    pattern: string;
    targetQuestions: number;
    targetMastery: number;
  }>;
  objectives: Array<{
    date: string;
    topic: string;
    patterns: Array<{
      pattern: string;
      targetQuestions: number;
      completedQuestions: number;
      targetDifficulty?: number;
    }>;
    targetMinutes: number;
    actualMinutes: number;
    status: string;
  }>;
}

export interface PlanPreviewWireResponse {
  success: true;
  data: PlanPreviewResultDto;
}

// Op 21: POST /api/v1/planning/generate (returns 201 with data: { plan, objectives, summary })
export interface PlanGeneratePayload {
  goalId: string;
  scope: PlanningScopeDto;
  name?: string;
  durationPreset?: '3d' | '7d' | '9d' | '1m' | '2m' | '3m' | '6m';
  startDate?: string;
  targetDate?: string;
  referenceDate?: string;
  dailyQuestionBudget?: number;
  dailyMinutes?: number;
  maxPatternsPerDay?: number;
  includeMastered?: boolean;
}

export type PlanGenerateRequestPayload = PlanGeneratePayload;

export interface StudyPlanSummaryDto {
  algorithmVersion: string;
  startDate: string;
  endDate: string;
  days: number;
  durationPreset: string | null;
  dailyQuestionBudget: number;
  dailyMinutes: number;
  maxPatternsPerDay: number;
  patternsRequested: number;
  prerequisitesAdded: number;
  patternsAlreadyMastered: number;
  patternsScheduled: number;
  patternsUnscheduled: number;
  unscheduledPatterns: string[];
  totalRequestedWorkload: number;
  horizonQuestionCapacity: number;
  scheduledWorkload: number;
  unscheduledWorkload: number;
  capacityShortfall: boolean;
  reasonCodes: string[];
}

export interface StudyPlanDto {
  _id: string;
  userId: string;
  goalId: string;
  name: string;
  scope: 'short' | 'medium' | 'long';
  phase: 'core' | 'remediation' | 'retention';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  targets: Array<{
    topic: string;
    pattern: string;
    targetQuestions: number;
    targetMastery: number;
  }>;
  planningMeta?: {
    algorithmVersion: string;
    durationPreset: string | null;
    generatedAutomatically: boolean;
    dailyQuestionBudget: number;
    dailyMinutes: number;
    maxPatternsPerDay: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanGenerateResultDto {
  plan: StudyPlanDto;
  objectives: DailyObjectiveDto[];
  summary: StudyPlanSummaryDto;
}

export interface StudyPlanGenerateWireResponse {
  success: true;
  data: StudyPlanGenerateResultDto;
}

export type PlanGenerateWireResponse = StudyPlanGenerateWireResponse;

// Single study plan wire response (e.g. GET /api/v1/study-plans/:id)
export interface StudyPlanWireResponse {
  success: true;
  data: StudyPlanDto;
}

// Op 22: POST /api/v1/planning/plans/:planId/replan
export interface PlanReplanPayload {
  referenceDate?: string;
  replaceToday?: boolean;
  allowReplaceToday?: boolean;
  includeMastered?: boolean;
}

export type PlanReplanRequestPayload = PlanReplanPayload;

export interface PlanReplanResultDto {
  success: true;
  planId: string;
  algorithmVersion: string;
  replanCutoffDate: string;
  startReplanDate: string;
  remainingDays: number;
  preservedObjectives: number;
  removedFutureObjectives: number;
  newObjectives: number;
  patternsRescheduled: number;
  patternsSkippedAsMastered: number;
  unscheduledPatterns: string[];
  remainingCapacity: number;
  reasonCodes: string[];
}

export interface PlanReplanWireResponse {
  success: true;
  data: PlanReplanResultDto;
}

// Op 23: GET /api/v1/planning/plans/:planId/schedule
export interface PlanScheduleResultDto {
  planId: string;
  planName: string;
  userId: string;
  goalId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalObjectives: number;
  objectives: DailyObjectiveDto[];
}

export interface PlanScheduleWireResponse {
  success: true;
  data: PlanScheduleResultDto;
}

// Op 24: GET /api/v1/study-plans/user/:userId
export interface PlanListWireResponse {
  success: true;
  data: StudyPlanDto[];
  meta: {
    count: number;
  };
}

// Op 25: GET /api/v1/daily-objectives/user/:userId
export interface DailyObjectiveDto {
  _id: string;
  userId: string;
  planId: string;
  goalId: string;
  date: string;
  topic: string;
  patterns: Array<{
    pattern: string;
    targetQuestions: number;
    completedQuestions: number;
    targetDifficulty?: number;
  }>;
  targetMinutes: number;
  actualMinutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  createdAt: string;
  updatedAt: string;
}

export interface DailyObjectiveListWireResponse {
  success: true;
  data: DailyObjectiveDto[];
  meta: PaginationMeta;
}

// Op 26: PATCH /api/v1/daily-objectives/:id
export interface DailyObjectivePatchPayload {
  topic?: string;
  patterns?: Array<{
    pattern: string;
    targetQuestions?: number;
    completedQuestions?: number;
    targetDifficulty?: number;
  }>;
  targetMinutes?: number;
  actualMinutes?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface DailyObjectivePatchWireResponse {
  success: true;
  data: DailyObjectiveDto;
}

// ── Attempts & History DTOs (Operations 27–28) ────────────────────────────────────────────
// Op 27: POST /api/v1/attempts
export interface AttemptCreatePayload {
  questionId: string;
  selectedAnswer: string;
  timeTaken: number;
  source: string;
  sessionId?: string;
}

export type AttemptRecordRequestPayload = AttemptCreatePayload;

export interface AttemptRecordDto {
  _id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  source: string;
  sessionId?: string | null;
  topic: string;
  pattern: string;
  difficulty: number;
  createdAt: string;
}

export interface AttemptCreateWireResponse {
  success: true;
  data: AttemptRecordDto;
}

export type AttemptRecordWireResponse = AttemptCreateWireResponse;

// Op 28: GET /api/v1/attempts/user/:userId
export interface AttemptListWireResponse {
  success: true;
  data: AttemptRecordDto[];
  meta: PaginationMeta;
}

// ── Progress & Student Mastery DTOs (Operations 29–33) ────────────────────────────────────
export interface StudentProgressDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  attempts: number;
  correct: number;
  accuracy: number;
  mastery: number;
  streak: number;
  lastAttemptDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Op 29: GET /api/v1/progress/:userId
export interface ProgressOverallWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: PaginationMeta;
}

export type StudentProgressWireResponse = ProgressOverallWireResponse;

// Op 30: GET /api/v1/progress/:userId/topics
export interface ProgressTopicsWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: {
    count: number;
  };
}

export type TopicMasteryWireResponse = ProgressTopicsWireResponse;

// Op 31: GET /api/v1/progress/:userId/patterns
export interface ProgressPatternsWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: {
    count: number;
  };
}

export type PatternMasteryWireResponse = ProgressPatternsWireResponse;

export interface WeakestPatternDto {
  topic: string;
  pattern: string;
  accuracy: number;
  attempts: number;
  mastery: number;
}

// Op 32: GET /api/v1/progress/:userId/weakest
export interface ProgressWeakestWireResponse {
  success: true;
  data: WeakestPatternDto[];
  meta: {
    count: number;
  };
}

export type WeakestPatternsWireResponse = ProgressWeakestWireResponse;

export interface PrerequisiteDataDto {
  pattern: string;
  topic: string;
  prerequisites: string[];
  prerequisiteCount: number;
  dependents: string[];
  dependentCount: number;
  isFoundational: boolean;
}

// Op 33: GET /api/v1/progress/prerequisites/:patternName
export interface ProgressPrerequisitesWireResponse {
  success: true;
  data: PrerequisiteDataDto;
}

export type PrerequisiteGraphWireResponse = ProgressPrerequisitesWireResponse;

// ── Adaptive Decision Engine DTOs (Operation 34) ──────────────────────────────────────────
export interface AdaptiveQuestionDto {
  _id: string;
  question: string;
  options: string[];
  topic: string;
  pattern: string;
  difficulty: number;
}

export interface AdaptiveDecisionDto {
  requestedPattern?: string;
  selectedTopic: string;
  selectedPattern: string;
  mastery: number;
  recentAccuracy: number;
  baseDifficulty: number;
  adjustment: number;
  targetDifficulty: number;
  selectedDifficulty: number;
  fallbackUsed: boolean;
  prerequisiteRedirect: boolean;
  reasonCodes: string[];
}

// Op 34: GET /api/v1/adaptive/next-question
export interface AdaptiveNextQuestionWireResponse {
  success: true;
  data: {
    question: AdaptiveQuestionDto;
    decision: AdaptiveDecisionDto;
  };
}

// ── Spaced Revision Engine DTOs (Operations 35–37) ────────────────────────────────────────
export interface RevisionDueItemDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  dueDate: string;
  intervalDays: number;
  stage: number;
  mastery: number;
  reasonCode: string;
  registryIndex: number;
}

// Op 35: GET /api/v1/revisions/due
export interface RevisionDueListWireResponse {
  success: true;
  count: number;
  data: RevisionDueItemDto[];
}

export interface RevisionPlanProjectionDto {
  days: number;
  referenceDate: string;
  projections: Array<{
    date: string;
    count: number;
    patterns: string[];
  }>;
}

// Op 36: GET /api/v1/revisions/plan
export interface RevisionPlanWireResponse {
  success: true;
  data: RevisionPlanProjectionDto;
}

export interface RevisionItemDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  intervalDays: number;
  easeFactor: number;
  stage: number;
  dueDate: string;
  lastReviewedAt?: string;
}

export interface RevisionRebuildPayload {
  topic?: string;
  pattern?: string;
  referenceDate?: string;
}

export type RevisionRebuildRequestPayload = RevisionRebuildPayload;

// Op 37: POST /api/v1/revisions/rebuild
export interface RevisionRebuildWireResponse {
  success: true;
  message: string;
  data: RevisionItemDto | RevisionItemDto[] | null;
}

// ── Mock Test Engine DTOs (Operations 38–48) ──────────────────────────────────────────────
export interface MockBlueprintSectionDto {
  sectionId: string;
  name: string;
  durationMinutes: number;
  topics: string[];
  questionCount: number;
}

export interface MockBlueprintDto {
  _id: string;
  title: string;
  description?: string;
  mode: 'standard' | 'adaptive' | 'speed_challenge';
  totalDurationMinutes: number;
  sections: MockBlueprintSectionDto[];
  status: 'draft' | 'published' | 'archived';
  scoring?: Record<string, unknown>;
  excludeRecentQuestions?: number;
  algorithmVersion?: string;
  createdAt: string;
}

// Op 38: GET /api/v1/mock-blueprints
export interface MockBlueprintListWireResponse {
  success: true;
  data: MockBlueprintDto[];
}

// Op 39: POST /api/v1/mock-sessions (no top-level mode; mode belongs to blueprint)
export interface MockSessionCreatePayload {
  blueprintId?: string;
  blueprint?: Record<string, unknown>;
  generationSeed?: string;
}

export type MockSessionCreateRequestPayload = MockSessionCreatePayload;

export interface MockSessionDocDto {
  _id: string;
  userId: string;
  blueprintId: string;
  status: 'created' | 'started' | 'submitted' | 'expired' | 'abandoned';
  navigationPolicy: string;
  currentSectionId: string;
  responsesFrozen: boolean;
  finalizationState: 'idle' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
}

export interface MockSessionCreateWireResponse {
  success: true;
  data: MockSessionDocDto;
}

// Op 40: POST /api/v1/mock-sessions/:id/start
export interface MockSessionStartWireResponse {
  success: true;
  data: MockSessionDocDto;
}

export interface MockSessionDetailDto extends MockSessionDocDto {
  sections: Array<{
    sectionId: string;
    name: string;
    durationMinutes: number;
    status: 'pending' | 'in_progress' | 'completed';
    questionCount: number;
  }>;
}

// Op 41: GET /api/v1/mock-sessions/:id
export interface MockSessionDetailWireResponse {
  success: true;
  data: MockSessionDetailDto;
}

export interface ActiveMockQuestionDto {
  questionId: string;
  sectionId: string;
  order: number;
  question: string;
  options: string[];
  topic: string;
  pattern: string;
  difficulty: number;
}

// Op 42: GET /api/v1/mock-sessions/:id/questions/:questionId
export interface MockQuestionWireResponse {
  success: true;
  data: ActiveMockQuestionDto;
}

// Op 43: POST /api/v1/mock-sessions/:id/responses
export interface MockResponseSavePayload {
  questionId: string;
  sectionId: string;
  selectedOption: string | null;
  timeSpentSeconds?: number;
  isFlagged?: boolean;
}

export interface MockResponseDocDto {
  _id: string;
  sessionId: string;
  questionId: string;
  sectionId: string;
  selectedOption: string | null;
  timeSpentSeconds: number;
  isFlagged: boolean;
  status: string;
  updatedAt: string;
}

export interface MockResponseSaveWireResponse {
  success: true;
  data: MockResponseDocDto;
}

export interface MockSectionCompleteResultDto {
  sessionId: string;
  sectionId: string;
  status: 'completed';
  nextSectionId: string | null;
}

// Op 44: POST /api/v1/mock-sessions/:id/sections/:sectionId/complete
export interface MockSectionCompleteWireResponse {
  success: true;
  data: MockSectionCompleteResultDto;
}

export interface MockSessionSubmitResultDto {
  sessionId: string;
  status: 'submitted';
  finalizationState: 'in_progress' | 'completed';
}

// Op 45: POST /api/v1/mock-sessions/:id/submit
export interface MockSubmitWireResponse {
  success: true;
  data: MockSessionSubmitResultDto;
}

// Op 46: POST /api/v1/mock-sessions/:id/abandon
export interface MockSessionAbandonWireResponse {
  success: true;
  data: MockSessionDocDto;
}

export interface MockScoringResultDto {
  sessionId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  percentile?: number | null;
  sectionScores: Array<{
    sectionId: string;
    score: number;
    maxScore: number;
    accuracy: number;
  }>;
  accuracy: number;
  totalTimeSpentSeconds: number;
  speedScore?: number;
  staminaIndex?: number;
}

// Op 47: GET /api/v1/mock-sessions/:id/result
export interface MockResultWireResponse {
  success: true;
  data: MockScoringResultDto;
}

export interface MockReviewQuestionDto {
  questionId: string;
  order: number;
  question: string;
  options: string[];
  selectedOption: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  timeSpentSeconds: number;
  topic: string;
  pattern: string;
  difficulty: number;
}

export interface MockReviewDetailDto {
  sessionId: string;
  scoring: MockScoringResultDto;
  questions: MockReviewQuestionDto[];
}

// Op 48: GET /api/v1/mock-sessions/:id/review
export interface MockSessionReviewWireResponse {
  success: true;
  data: MockReviewDetailDto;
}
export type MockReviewWireResponse = MockSessionReviewWireResponse;

// ── Cognitive Analytics DTOs (Operations 49–52) ───────────────────────────────────────────
// Op 49: GET /api/v1/analytics/dashboard
export interface TopicMasteryRadarItemDto {
  topic: string;
  masteryScore: number;
  practiceAttempts: number;
}

export interface ActivePlanSummaryDto {
  planId: string;
  planName: string;
  targetDate: string;
  daysRemaining: number;
  totalAssignedQuestions: number;
  totalCompletedQuestions: number;
}

export interface AnalyticsDashboardResponseDto {
  userId: string;
  algorithmVersion: string;
  summary: {
    totalPracticeAttempts: number;
    totalMocksCompleted: number;
    overallAccuracy: number | null;
    attemptsAnalyzed: number;
  };
  topicMasteryRadar: TopicMasteryRadarItemDto[];
  activePlanSummary: ActivePlanSummaryDto | null;
  dueRevisionCount: number;
  priorityFocusTopics: string[];
}

export interface AnalyticsDashboardWireResponse {
  success: true;
  data: AnalyticsDashboardResponseDto;
}

// Op 50: GET /api/v1/analytics/cognitive-profile
export interface StaminaQuartileItemDto {
  quartile: number;
  accuracy: number;
  totalQuestions: number;
  correctQuestions: number;
}

export interface StaminaCurveDto {
  mockSessionsAnalyzed: number;
  totalQuestionsAnalyzed: number;
  quartileAccuracy: StaminaQuartileItemDto[];
  fatigueDropoffPercent: number | null;
  fatigueReason?: string | null;
}

export interface CognitiveProfileResponseDto {
  userId: string;
  algorithmVersion: string;
  analysisWindow: {
    windowDays: number;
    attemptsAnalyzed: number;
  };
  speedAccuracyMatrix: {
    quadrantCounts: {
      accurateAndFast: number;
      accurateAndSlow: number;
      fastErrorRushing: number;
      slowErrorStruggling: number;
    };
    insufficientBaselineCount: number;
    rushingRiskScore: number | null;
    medianTimeCorrectSeconds: number | null;
    medianTimeIncorrectSeconds: number | null;
  };
  staminaCurve: StaminaCurveDto | null;
  staminaReason?: string | null;
}

export interface CognitiveProfileWireResponse {
  success: true;
  data: CognitiveProfileResponseDto;
}

// Op 51: GET /api/v1/analytics/retention
export interface RetentionGapBucketDto {
  gapBucket: string;
  totalEvents: number;
  correctEvents: number;
  observedRetentionRate: number;
}

export interface RetentionAnalyticsResponseDto {
  userId: string;
  algorithmVersion: string;
  currentState: {
    activeRevisionItems: number;
    completedRevisionItems: number;
    dueTodayCount: number;
    overdueCount: number;
    stageDistribution: {
      stage0_1day: number;
      stage1_3days: number;
      stage2_7days: number;
      stage3_14days: number;
      stage4_30days: number;
    };
  };
  observedRetentionByGap: RetentionGapBucketDto[];
  evidence: {
    revisionAttemptsAnalyzed: number;
    excludedNoPriorAttemptCount: number;
    excludedShortGapCount: number;
    excludedInvalidChronologyCount: number;
  };
}

export interface RetentionAnalyticsWireResponse {
  success: true;
  data: RetentionAnalyticsResponseDto;
}

// Op 52: GET /api/v1/analytics/readiness/:goalId
export interface PrerequisiteBottleneckDto {
  targetPattern: string;
  unmasteredPrerequisite: string;
  prerequisiteMastery: number;
  masteryLabel: string;
}

export interface ExamReadinessResponseDto {
  goalId: string;
  goalTitle: string;
  targetDate: string | null;
  algorithmVersion: string;
  readinessStatus: 'calculated' | 'insufficient_data';
  readinessScore: number | null;
  reason?: string | null;
  components: {
    planTargetCoverage: number | null;
    masteryDepth: number | null;
    eligibleMockPerformance: number | null;
    eligibleMockPacing: number | null;
  };
  criticalPrerequisiteBottlenecks: PrerequisiteBottleneckDto[];
}

export interface ExamReadinessWireResponse {
  success: true;
  data: ExamReadinessResponseDto;
}

// ── Prescriptive Orchestration DTOs (Operations 53–55) ────────────────────────────────────
export interface PublicActionDto {
  actionId: string;
  actionType: string;
  actionSubtype?: string;
  priorityTier: number;
  policyPriorityClass: string;
  urgencyScore: number;
  topic: string;
  pattern: string;
  prescribedQuestions: number;
  estimatedMinutes: number;
  rationale: string | null;
  executionIntent: string | null;
  blockedTarget?: {
    topic: string;
    pattern: string;
  };
}

export interface NextActionRecommendationDto {
  status: string;
  reason: string;
  activeMockSessionId?: string | null;
  nextAction: PublicActionDto | null;
}

// Op 53: GET /api/v1/orchestration/next-action
export interface NextActionWireResponse {
  success: true;
  data: NextActionRecommendationDto;
  meta: {
    referenceNow: string;
  };
}

export interface AgendaCheckpointRationaleDto {
  reasonCode: string;
  description: string;
}

export interface AgendaCheckpointDto {
  checkpointId: string;
  checkpointType: string;
  afterSegmentIndex: number;
  beforeSegmentIndex: number;
  prescribedQuestions: number;
  estimatedMinutes: number;
  rationale: AgendaCheckpointRationaleDto;
  executionIntent: string | null;
}

export interface AgendaSegmentDto {
  segmentIndex: number;
  segmentName: string;
  segmentBudget: number;
  allocatedQuestions: number;
  activities: PublicActionDto[];
}

export interface DailyAgendaPayloadDto {
  dailyQuestionBudget: number;
  totalPrescribedQuestions: number;
  totalEstimatedMinutes: number;
  segments: AgendaSegmentDto[];
  checkpoints: AgendaCheckpointDto[];
}

export interface DailyAgendaContainerDto {
  status: string;
  reason?: string | null;
  activeMockSessionId?: string | null;
  agenda?: DailyAgendaPayloadDto | null;
}

export interface DailyAgendaWireResponse {
  success: true;
  data: DailyAgendaContainerDto;
  meta: {
    referenceNow: string;
  };
}

export type OrchestrationDailyAgendaWireResponse = DailyAgendaWireResponse;
export type DailyAgendaDto = DailyAgendaContainerDto;

export interface InterventionItemDto {
  interventionId: string;
  category: string;
  severity: string;
  topic: string;
  pattern: string | null;
  blockedTarget: string | null;
  rationale: string;
}

export interface InterventionListContainerDto {
  status: string;
  reason?: string | null;
  interventions: InterventionItemDto[];
}

export interface InterventionListWireResponse {
  success: true;
  data: InterventionListContainerDto;
  meta: {
    referenceNow: string;
  };
}

export type OrchestrationInterventionsWireResponse = InterventionListWireResponse;

// ── PAOA Attribution & Prescription Lifecycle (Operations 56, 57, 64) ───────────────────────
// Op 64: POST /api/v1/attribution/prescriptions
// Backend requires actionId for daily_agenda, but arbiter selects for next_action.
export interface PrescriptionIssuanceRequestPayload {
  originSurface: 'next_action' | 'daily_agenda';
  actionId?: string;
  goalId?: string;
}

export interface PrescriptionIssuanceDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  isExpired: boolean;
  originSurface: string;
  action: PublicActionDto;
  issuedAt: string;
  expiresAt: string;
  versions: {
    phase10AlgorithmVersion: string;
    orchestrationAlgorithmVersion: string;
  };
}

export interface AttributionIssuanceWireResponse {
  success: true;
  data: PrescriptionIssuanceDto;
  meta: {
    referenceNow: string;
  };
}

// Op 56: POST /api/v1/attribution/prescriptions/:prescriptionId/activate
export interface PrescriptionActivationDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  isExpired: boolean;
  actionType: string;
  topic: string;
  pattern: string;
  prescribedQuestions: number;
  activatedAt: string;
  expiresAt: string;
  executionGuidance: {
    targetMode?: string;
    instructions: string;
    sessionId?: string;
    targetSource?: string;
  };
}

export interface AttributionActivationWireResponse {
  success: true;
  data: PrescriptionActivationDto;
  meta: {
    referenceNow: string;
  };
}

export type PrescriptionLeaseWireResponse = AttributionActivationWireResponse;

// Op 57: POST /api/v1/attribution/prescriptions/:prescriptionId/complete
export interface PrescriptionCompletePayload {
  abandon?: boolean;
  mockSessionId?: string | null;
}

export interface PrescriptionCompletionDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  completedAt: string;
  executionRequirementMet: boolean;
  targetMilestoneMet: boolean;
  outcomeSnapshot: Record<string, unknown>;
  mockSessionId: string | null;
  attributionNotice: string;
}

export interface AttributionCompletionWireResponse {
  success: true;
  data: PrescriptionCompletionDto;
  meta: {
    referenceNow: string;
  };
}

export type PrescriptionCompleteWireResponse = AttributionCompletionWireResponse;

// ── Intelligent Learning DTOs & Delivery Envelopes (Operations 58–63) ─────────────────────
// Section 8.8 Uniform response delivery envelope (returns { data, metadata, provenance } without success boolean)
export interface LearningMetadataDto {
  taskType: string;
  algorithmVersion: string;
  promptVersion: string | null;
  model: string | null;
  provider: string;
  isDegraded: boolean;
  degradationReason: string | null;
}

export interface LearningProvenanceDto {
  facts: string[];
  deterministicSignals: string[];
  llmInterpretations: string[];
}

// Op 58: POST /api/v1/learning/tutor
export interface TutorRequestPayload {
  questionId?: string;
  topic?: string;
  pattern?: string;
  message?: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

export type LearningTutorRequestPayload = TutorRequestPayload;

export interface ConceptTutorDto {
  topic: string;
  pattern: string;
  conceptExplanation: string;
  formulaSummary: string | null;
  workedExample: {
    setup: string;
    solutionSteps: string[];
    finalResult: string;
  } | null;
  keyTakeaway: string;
}

export interface LearningTutorResponseDto {
  data: ConceptTutorDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type TutorWireResponse = LearningTutorResponseDto;

// Op 59: POST /api/v1/learning/hint
export interface HintRequestPayload {
  questionId: string;
  hintLevel: number;
}

export type LearningHintRequestPayload = HintRequestPayload;

export interface HintDto {
  hintLevel: number;
  hint: string;
  revealsAnswer: boolean;
  nextAction: 'try_calculation' | 'review_formula' | 'check_options' | 'view_explanation';
}

export interface LearningHintResponseDto {
  data: HintDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type HintWireResponse = LearningHintResponseDto;

// Op 60: POST /api/v1/learning/explain-attempt
export interface ExplainAttemptPayload {
  attemptId?: string;
  questionId?: string;
  selectedAnswer?: string;
  timeTaken?: number;
}

export type LearningExplainAttemptPayload = ExplainAttemptPayload;

export interface ExplainAttemptDto {
  conceptSummary: string;
  mistakeExplanation: string;
  correctApproach: string;
  revisionSuggestion: string;
  confidence: number | null;
}

export interface LearningExplainAttemptResponseDto {
  data: ExplainAttemptDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainAttemptWireResponse = LearningExplainAttemptResponseDto;

// Op 61: POST /api/v1/learning/explain-progress
export interface ExplainProgressPayload {
  userId: string;
  topic?: string;
  pattern?: string;
}

export type LearningExplainProgressPayload = ExplainProgressPayload;

export interface ExplainProgressDto {
  masteryInterpretation: string;
  strengths: string[];
  weaknesses: string[];
  recommendedAction: string;
}

export interface LearningExplainProgressResponseDto {
  data: ExplainProgressDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainProgressWireResponse = LearningExplainProgressResponseDto;

// Op 62: POST /api/v1/learning/explain-plan
export interface ExplainPlanPayload {
  planId: string;
  targetDate?: string;
}

export type LearningExplainPlanPayload = ExplainPlanPayload;

export interface ExplainPlanDto {
  planId: string;
  targetDate: string;
  objectiveSummary: string;
  schedulingReasons: string[];
  revisionSummary: string | null;
  recommendedAction: string;
}

export interface LearningExplainPlanResponseDto {
  data: ExplainPlanDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainPlanWireResponse = LearningExplainPlanResponseDto;

// Op 63: POST /api/v1/learning/mock-review
export interface MockReviewPayload {
  sessionId: string;
}

export type LearningMockReviewPayload = MockReviewPayload;

export interface MockReviewDto {
  overallScoreInterpretation: string;
  sectionDiagnostics: Array<{
    sectionId: string;
    diagnosticMessage: string;
    performanceTier: 'strong' | 'competent' | 'needs_focus' | null;
  }>;
  pacingObservations: string;
  priorityRevisionPatterns: string[];
}

export interface LearningMockReviewResponseDto {
  data: MockReviewDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type LearningMockReviewWireResponse = LearningMockReviewResponseDto;

export type MockReviewAiWireResponse = MockReviewWireResponse;

// Canonical aliases for type interoperability
export type MockQuestionDto = ActiveMockQuestionDto;
export type MockReviewItemDto = MockReviewQuestionDto;
export type UserPrincipal = UserProfileDto;
export interface UserSessionSummary {
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
}
export type NextActionDto = PublicActionDto;
export type PlanPreviewDto = PlanPreviewResultDto;
export type PatternMasteryItemDto = StudentProgressDto;
export type GoalDto = GoalDetailDto;
export type WeakestPatternsResponseDto = WeakestPatternDto[];


