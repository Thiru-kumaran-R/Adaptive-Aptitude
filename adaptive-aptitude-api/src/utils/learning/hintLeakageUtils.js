'use strict';

/**
 * hintLeakageUtils.js — Content-Level Hint Leakage Detection & Normalization
 *
 * Implements multi-representation leakage detection and numeric equivalence
 * matching as specified in Section 16 of Phase 7 specification.
 */

/**
 * Deterministically derives normalized representations and mathematical equivalents
 * for a canonical answer (integers, decimals, percentages, and simple fractions).
 *
 * @param {string} rawAnswer - Canonical answer string
 * @returns {{
 *   raw: string,
 *   normalized: string,
 *   numericValue: number|null,
 *   isPercentage: boolean,
 *   isFraction: boolean,
 *   equivalents: string[]
 * }}
 */
const deriveNumericEquivalents = (rawAnswer) => {
  const clean = String(rawAnswer || '').trim();
  const equivalents = new Set();
  equivalents.add(clean.toLowerCase());

  // 1. Percentage Normalization (e.g. "21%" <-> "21 percent" <-> "0.21")
  if (clean.includes('%')) {
    const numPart = clean.replace(/[^0-9.]/g, '');
    const numVal = parseFloat(numPart);
    if (!isNaN(numVal)) {
      equivalents.add(`${numPart}%`);
      equivalents.add(`${numPart} percent`);
      equivalents.add(`${numPart}percent`);
      const decimalVal = (numVal / 100).toString();
      equivalents.add(decimalVal);
      return {
        raw: clean,
        normalized: clean.toLowerCase().replace(/[^a-z0-9]/g, ''),
        numericValue: numVal,
        isPercentage: true,
        isFraction: false,
        equivalents: Array.from(equivalents),
      };
    }
  }

  // 2. Simple Fraction Normalization (e.g. "1/2" <-> "0.5", "2/5" <-> "0.4", "3/8" <-> "0.375")
  const fractionMatch = clean.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const denom = parseInt(fractionMatch[2], 10);
    if (denom !== 0) {
      const decimal = num / denom;
      // Bounded precision: exact integer or rounded up to 4 decimal places
      const decimalStr = Number.isInteger(decimal)
        ? decimal.toString()
        : parseFloat(decimal.toFixed(4)).toString();
      equivalents.add(`${num}/${denom}`);
      equivalents.add(decimalStr);
      return {
        raw: clean,
        normalized: clean.toLowerCase().replace(/[^a-z0-9]/g, ''),
        numericValue: decimal,
        isPercentage: false,
        isFraction: true,
        equivalents: Array.from(equivalents),
      };
    }
  }

  // 3. Plain Numeric Normalization (integers and decimals)
  const plainNum = parseFloat(clean);
  if (!isNaN(plainNum) && /^-?\d+(\.\d+)?$/.test(clean)) {
    equivalents.add(plainNum.toString());
    return {
      raw: clean,
      normalized: clean.toLowerCase().replace(/[^a-z0-9]/g, ''),
      numericValue: plainNum,
      isPercentage: false,
      isFraction: false,
      equivalents: Array.from(equivalents),
    };
  }

  return {
    raw: clean,
    normalized: clean.toLowerCase().replace(/[^a-z0-9]/g, ''),
    numericValue: null,
    isPercentage: false,
    isFraction: false,
    equivalents: Array.from(equivalents),
  };
};

/**
 * Authoritative reveal prefixes that indicate answer disclosure.
 */
const DIRECT_REVEAL_PREFIXES = [
  'answer',
  'the answer',
  'final answer',
  'correct answer',
  'result',
  'final result',
  'value',
  'final value',
  'option',
  'correct option',
  'choose',
  'select',
  'equals',
  'gives',
  'yields',
  'therefore',
  'you should select',
];

/**
 * Authoritative Content-Level Leakage Validator for Hint Levels 1–4.
 * Applied to BOTH LLM completions and generated deterministic fallbacks.
 *
 * @param {string} hintText - Plain hint string from model or fallback generator
 * @param {boolean} revealsAnswer - Model/generator reported boolean
 * @param {Object} question - Authoritative Phase 2 Question document
 * @returns {boolean} True if safe, False if leakage detected (fails closed)
 */
const validateHintContentLeakage = (hintText, revealsAnswer, question) => {
  // 1. Model-reported boolean check (both required: revealsAnswer === false AND content passes)
  if (revealsAnswer !== false) return false;
  if (!hintText || typeof hintText !== 'string') return false;

  const canonicalAnswer = String(question.answer || '').trim();
  const options = question.options || [];

  // 2. Resolve matching option index and text from actual Phase 2 Question model
  const correctOptionIdx = options.findIndex((opt) => opt === canonicalAnswer);
  const correctOptionLetter = correctOptionIdx >= 0 ? String.fromCharCode(65 + correctOptionIdx) : null;
  const correctOptionText = correctOptionIdx >= 0 ? options[correctOptionIdx] : canonicalAnswer;

  const normalize = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const normHint = normalize(hintText);
  const normAnswer = normalize(canonicalAnswer);
  const normOptionText = normalize(correctOptionText);

  // Authoritative reveal-context regex generated from DIRECT_REVEAL_PREFIXES.
  const prefixGroup = '(?:the\\s+answer|final\\s+answer|correct\\s+answer|answer|final\\s+result|result|final\\s+value|value|correct\\s+option|option|choose|select|equals?|gives|yields|therefore|you\\s+should\\s+select)';

  // 3. Option Label Reveal (e.g. "Option A", "choose A", "select A", "answer is A", "correct answer is A", "A is correct", "A is the answer")
  if (correctOptionLetter) {
    const labelPrefixRegex = new RegExp(
      `\\b${prefixGroup}\\s*(?:is|=|:)?\\s*${correctOptionLetter}\\b`,
      'i'
    );
    if (labelPrefixRegex.test(hintText)) return false;

    const labelSuffixRegex = new RegExp(
      `\\b${correctOptionLetter}\\s*(?:is|=|:)\\s*(?:correct|the\\s*answer|the\\s*correct\\s*answer|the\\s*result|the\\s*final\\s*answer)\\b`,
      'i'
    );
    if (labelSuffixRegex.test(hintText)) return false;
  }

  // 4. Reveal-Context Detection: structured answer-giving phrases
  const revealContextRegex = new RegExp(`${prefixGroup}\\s*(=|:|is|\\b)`, 'i');

  // 5. Normalized exact text & answer inclusion in reveal context
  if (normAnswer.length >= 2 && normHint.includes(normAnswer)) {
    if (revealContextRegex.test(hintText) || normHint === normAnswer) return false;
  }
  if (normOptionText.length >= 2 && normHint.includes(normOptionText)) {
    if (revealContextRegex.test(hintText) || normHint === normOptionText) return false;
  }

  // 6. Multi-Representation Numeric & Equivalence Checks via deriveNumericEquivalents
  const derived = deriveNumericEquivalents(canonicalAnswer);

  for (const equiv of derived.equivalents) {
    const normEquiv = normalize(equiv);
    if (normEquiv.length >= 2 && normHint.includes(normEquiv)) {
      if (revealContextRegex.test(hintText) || normHint === normEquiv) return false;
    }
  }

  // Percentage variant checks (e.g., "21 percent", decimal "0.21" in answer context)
  if (derived.isPercentage && derived.numericValue !== null) {
    const percentWordRegex = new RegExp(`\\b${derived.numericValue}\\s*percent\\b`, 'i');
    if (percentWordRegex.test(hintText)) return false;

    const decimalStr = (derived.numericValue / 100).toString();
    const decimalRevealRegex = new RegExp(`\\b${prefixGroup}\\s*(?:is|=|:)?\\s*${decimalStr}\\b`, 'i');
    if (decimalRevealRegex.test(hintText)) return false;
  }

  // Simple fraction variant checks (e.g. "0.5" for 1/2, "0.4" for 2/5, "0.375" for 3/8)
  if (derived.isFraction && derived.numericValue !== null) {
    const decimalStr = derived.numericValue.toString();
    const fractionDecimalRegex = new RegExp(`\\b${prefixGroup}\\s*(?:is|=|:)?\\s*${decimalStr}\\b`, 'i');
    if (fractionDecimalRegex.test(hintText)) return false;
  }

  // 7. Single-Character & Single-Digit Short Answers (Fail-Closed)
  if (canonicalAnswer.length === 1 || (derived.numericValue !== null && Math.abs(derived.numericValue) < 10)) {
    const shortVal = canonicalAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const shortRevealRegex = new RegExp(
      `\\b${prefixGroup}\\s*(?:is|=|:)?\\s*${shortVal}\\b`,
      'i'
    );
    if (shortRevealRegex.test(hintText)) return false;
  }

  return true;
};

module.exports = {
  deriveNumericEquivalents,
  DIRECT_REVEAL_PREFIXES,
  validateHintContentLeakage,
};
