// src/types/analytics.ts
import type {
  AnalyticsDashboardResponseDto,
  CognitiveProfileResponseDto,
  RetentionAnalyticsResponseDto,
  ExamReadinessResponseDto,
} from './api';

export type CognitiveDiagnosticsViewModel = Readonly<Pick<
  CognitiveProfileResponseDto,
  'analysisWindow' | 'speedAccuracyMatrix' | 'staminaCurve' | 'staminaReason'
>>;
export type SpeedAccuracyMatrixViewModel = Readonly<
  CognitiveProfileResponseDto['speedAccuracyMatrix']['quadrantCounts']
>;
export type StaminaProfileViewModel = CognitiveProfileResponseDto['staminaCurve'];
export type TopicMasteryViewModel = ReadonlyArray<
  AnalyticsDashboardResponseDto['topicMasteryRadar'][number]
>;
export type RetentionEvidenceViewModel = Readonly<Pick<
  RetentionAnalyticsResponseDto,
  'currentState' | 'observedRetentionByGap' | 'evidence'
>>;
export type ReadinessEvidenceViewModel = Readonly<Pick<
  ExamReadinessResponseDto,
  'goalId' | 'goalTitle' | 'targetDate' | 'readinessStatus' | 'readinessScore' |
  'reason' | 'components' | 'criticalPrerequisiteBottlenecks'
>>;
