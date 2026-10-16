'use strict';

/**
 * promptService.js — Prompt Synthesis & Quarantined Assembly
 *
 * Enforces structural isolation between platform context, untrusted conversation history,
 * and untrusted student query input.
 */

const tutorPrompt = require('../../config/prompts/tutorPrompt');
const hintPrompt = require('../../config/prompts/hintPrompt');
const mistakePrompt = require('../../config/prompts/mistakePrompt');
const progressPrompt = require('../../config/prompts/progressPrompt');
const planPrompt = require('../../config/prompts/planPrompt');
const mockReviewPrompt = require('../../config/prompts/mockReviewPrompt');
const { LEARNING_LLM_RUNTIME } = require('../../config/learningConfig');

const TASK_PROMPTS = Object.freeze({
  concept_tutor: tutorPrompt,
  hint: hintPrompt,
  explain_attempt: mistakePrompt,
  explain_progress: progressPrompt,
  explain_plan: planPrompt,
  mock_review: mockReviewPrompt,
});

/**
 * Scrubs PII and request-tracking fields from the context before prompt transmission.
 *
 * @param {Object} context
 * @returns {Object} Scrubbed context
 */
function scrubContextForPrompt(context) {
  if (!context) return {};
  const scrubbed = JSON.parse(JSON.stringify(context));
  delete scrubbed.userId;
  return scrubbed;
}

/**
 * Sanitizes and bounds untrusted client conversation history.
 *
 * @param {Array} history
 * @returns {Array} Max 4 turns, with only role and text strings
 */
function sanitizeConversationHistory(history) {
  if (!Array.isArray(history)) return [];
  const maxTurns = LEARNING_LLM_RUNTIME.maxConversationTurns;
  const recent = history.slice(-maxTurns);

  return recent.map((turn) => ({
    role: turn.role === 'assistant' ? 'assistant' : 'user',
    text: String(turn.text || '').slice(0, 500),
  }));
}

/**
 * Sanitizes student query message.
 *
 * @param {string} message
 * @returns {string|null} Clamped to 500 chars
 */
function sanitizeStudentMessage(message) {
  if (!message || typeof message !== 'string') return null;
  return message.trim().slice(0, 500);
}

/**
 * Assembles prompt parameters for a task.
 *
 * @param {Object} params
 * @param {string} params.taskType
 * @param {Object} params.context
 * @param {string} [params.studentMessage]
 * @param {Array}  [params.conversationHistory]
 * @returns {{
 *   systemInstruction: string,
 *   promptVersion: string,
 *   scrubbedContext: Object,
 *   sanitizedStudentMessage: string|null,
 *   sanitizedHistory: Array
 * }}
 */
function assemblePrompt({ taskType, context, studentMessage, conversationHistory }) {
  const promptConfig = TASK_PROMPTS[taskType];
  if (!promptConfig) {
    throw new Error(`Unsupported task type for prompt assembly: ${taskType}`);
  }

  const scrubbedContext = scrubContextForPrompt(context);
  const sanitizedStudentMessage = sanitizeStudentMessage(studentMessage);
  const sanitizedHistory = sanitizeConversationHistory(conversationHistory);

  return {
    systemInstruction: promptConfig.systemInstruction,
    promptVersion: promptConfig.version,
    scrubbedContext,
    sanitizedStudentMessage,
    sanitizedHistory,
  };
}

module.exports = {
  assemblePrompt,
  scrubContextForPrompt,
  sanitizeConversationHistory,
  sanitizeStudentMessage,
  TASK_PROMPTS,
};
