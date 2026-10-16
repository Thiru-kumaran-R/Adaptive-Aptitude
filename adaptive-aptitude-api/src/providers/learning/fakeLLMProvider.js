'use strict';

/**
 * fakeLLMProvider.js — Hermetic Test Harness LLM Provider for Phase 7
 */

const LLMProvider = require('./llmProvider');
const { composeAuthorizedLevel5Hint } = require('../../utils/learning/authoritativeTextUtils');

class FakeLLMProvider extends LLMProvider {
  constructor(cannedResponses = {}) {
    super();
    this.providerName = 'fake';
    this.cannedResponses = cannedResponses;
    this.invocationLog = [];
  }

  getCapabilities() {
    return { supportsZeroRetention: true };
  }

  setResponse(taskType, response) {
    this.cannedResponses[taskType] = response;
  }

  async generate({ taskType, systemInstruction, context, studentMessage, conversationHistory, outputSchema, options }) {
    this.invocationLog.push({ taskType, context, studentMessage, conversationHistory, timestamp: new Date() });

    if (this.cannedResponses[taskType]) {
      const canned = this.cannedResponses[taskType];
      if (typeof canned === 'function') {
        const result = canned({ context, studentMessage, conversationHistory });
        return {
          content: result,
          rawUsage: { promptTokens: 120, completionTokens: 80 },
          model: 'fake-llm-v1',
        };
      }
      return {
        content: canned,
        rawUsage: { promptTokens: 120, completionTokens: 80 },
        model: 'fake-llm-v1',
      };
    }

    return {
      content: this.getDefaultResponse(taskType, context),
      rawUsage: { promptTokens: 100, completionTokens: 50 },
      model: 'fake-llm-v1',
    };
  }

  getDefaultResponse(taskType, context = {}) {
    switch (taskType) {
      case 'concept_tutor': {
        const topic = context.topicContext?.topic;
        const pattern = context.topicContext?.pattern;
        if (!topic || !pattern) {
          throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: topicContext.topic and topicContext.pattern required');
        }
        return {
          topic,
          pattern,
          conceptExplanation: 'Foundational concept explanation grounded in curriculum.',
          formulaSummary: null,
          workedExample: null,
          keyTakeaway: 'Focus on understanding the underlying pattern relationships.',
        };
      }
      case 'hint': {
        const hintLevel = context.taskInputContext?.hintLevel;
        if (!hintLevel) {
          throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: taskInputContext.hintLevel required');
        }
        const questionContext = context.questionContext;
        if (!questionContext) {
          throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: questionContext required');
        }
        const topicContext = context.topicContext;
        if (!topicContext) {
          throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: topicContext required');
        }
        const revealsAnswer = hintLevel === 5;
        let hintText = 'Focus on identifying the given quantities and the required unknown.';
        let nextAction = 'try_calculation';
        if (hintLevel === 4) {
          nextAction = 'review_formula';
        } else if (hintLevel === 5) {
          nextAction = 'view_explanation';
          if (!questionContext.correctAnswer) {
            throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: Level-5 correctAnswer required');
          }
          hintText = composeAuthorizedLevel5Hint({
            answer: questionContext.correctAnswer,
            explanation: questionContext.storedExplanation,
            maxLength: 600,
          });
        }
        return {
          hintLevel,
          hint: hintText,
          revealsAnswer,
          nextAction,
        };
      }
      case 'explain_attempt': {
        const attempt = context.attemptContext;
        if (!attempt) {
          throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: attemptContext required');
        }
        const pattern = context.topicContext?.pattern;
        if (!pattern) {
          throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: topicContext.pattern required');
        }
        const isCorrect = attempt.isCorrect === true;
        return {
          conceptSummary: isCorrect
            ? 'The response matches the canonical answer.'
            : 'Review the underlying pattern relationships.',
          mistakeExplanation: isCorrect
            ? 'The selected answer matches the canonical answer.'
            : 'The selected answer differs from the canonical answer.',
          correctApproach: 'Use the verified canonical explanation and pattern context.',
          revisionSuggestion: pattern,
          confidence: null,
        };
      }
      case 'explain_progress': {
        return {
          masteryInterpretation: 'Current mastery information is available from deterministic test context.',
          strengths: [],
          weaknesses: [],
          recommendedAction: 'Continue targeted practice.',
        };
      }
      case 'explain_plan': {
        const planId = context.planningContext?.planId;
        const targetDate = context.planningContext?.targetDate;
        if (!planId || !targetDate) {
          throw new Error('FAKE_PROVIDER_CONTEXT_ERROR: planningContext.planId and planningContext.targetDate required');
        }
        return {
          planId,
          targetDate,
          objectiveSummary: 'This objective follows the deterministic test plan.',
          schedulingReasons: [],
          revisionSummary: null,
          recommendedAction: 'Complete the scheduled objective.',
        };
      }
      case 'mock_review': {
        return {
          overallScoreInterpretation: 'Mock result interpreted from deterministic test context.',
          sectionDiagnostics: [],
          pacingObservations: 'No additional pacing observation in the default fake response.',
          priorityRevisionPatterns: [],
        };
      }
      default:
        throw new Error(`Unsupported taskType for FakeLLMProvider: ${taskType}`);
    }
  }
}

module.exports = FakeLLMProvider;
