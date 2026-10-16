// src/types/quiz.ts
import { QuestionDto, MockQuestionDto, MockReviewItemDto, AttemptRecordDto } from './api';

export interface QuizFeedbackViewModel {
  attempt: AttemptRecordDto;
  explanation: string;
}

export type PracticeQuestionCardProps = {
  mode: 'PRACTICE' | 'ADAPTIVE' | 'REVISION' | 'MISTAKE';
  question: QuestionDto;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  onSubmitAnswer: () => void;
  onFlagForReview?: () => void;
  isFlagged?: boolean;
  isSubmitting?: boolean;
  feedback?: QuizFeedbackViewModel | null;
  onRequestHint?: () => void;
  onDiagnoseError?: () => void;
};

export type ActiveMockQuestionCardProps = {
  mode: 'MOCK_EXAM';
  question: MockQuestionDto;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  onFlagForReview: () => void;
  isFlagged?: boolean;
  isSubmitting?: boolean;
  feedback?: never;
  onRequestHint?: never;
  onDiagnoseError?: never;
  onSubmitAnswer?: never;
};

export type MockReviewQuestionCardProps = {
  mode: 'MOCK_REVIEW';
  question: MockReviewItemDto;
  selectedOption?: never;
  onSelectOption?: never;
  onSubmitAnswer?: never;
  onFlagForReview?: never;
  isFlagged?: boolean;
  isSubmitting?: never;
  feedback?: never;
  onRequestHint?: never;
  onDiagnoseError?: never;
};

export type QuestionCardProps =
  | PracticeQuestionCardProps
  | ActiveMockQuestionCardProps
  | MockReviewQuestionCardProps;
