'use strict';

/**
 * tests/learning/hintLeakageValidator.test.js
 *
 * Tests multi-representation leakage detection, numeric equivalence derivation,
 * reveal prefix matching, and ordinary stem reference handling.
 */

const {
  deriveNumericEquivalents,
  validateHintContentLeakage,
  DIRECT_REVEAL_PREFIXES,
} = require('../../src/utils/learning/hintLeakageUtils');

describe('Phase 7: Content-Level Hint Leakage Validator', () => {
  describe('deriveNumericEquivalents', () => {
    it('normalizes percentages to words and decimals (21% -> 21 percent, 0.21)', () => {
      const res = deriveNumericEquivalents('21%');
      expect(res.isPercentage).toBe(true);
      expect(res.numericValue).toBe(21);
      expect(res.equivalents).toContain('21%');
      expect(res.equivalents).toContain('21 percent');
      expect(res.equivalents).toContain('0.21');
    });

    it('normalizes simple fractions to decimals (1/2 -> 0.5, 2/5 -> 0.4, 3/8 -> 0.375)', () => {
      const half = deriveNumericEquivalents('1/2');
      expect(half.isFraction).toBe(true);
      expect(half.numericValue).toBe(0.5);
      expect(half.equivalents).toContain('0.5');

      const twoFifths = deriveNumericEquivalents('2/5');
      expect(twoFifths.isFraction).toBe(true);
      expect(twoFifths.numericValue).toBe(0.4);
      expect(twoFifths.equivalents).toContain('0.4');

      const threeEighths = deriveNumericEquivalents('3/8');
      expect(threeEighths.isFraction).toBe(true);
      expect(threeEighths.numericValue).toBe(0.375);
      expect(threeEighths.equivalents).toContain('0.375');
    });

    it('normalizes plain integers and decimals', () => {
      const intVal = deriveNumericEquivalents('5');
      expect(intVal.numericValue).toBe(5);
      expect(intVal.equivalents).toContain('5');

      const decVal = deriveNumericEquivalents('12.5');
      expect(decVal.numericValue).toBe(12.5);
      expect(decVal.equivalents).toContain('12.5');
    });
  });

  describe('validateHintContentLeakage', () => {
    const mockQuestion = {
      question: 'If 5 workers complete a task in 10 days, find the work done.',
      options: ['5', '10', '15', '20'],
      answer: '5',
      explanation: 'Work done = 5 * 10 = 50.',
    };

    it('rejects immediately if revealsAnswer is not false', () => {
      const isSafe = validateHintContentLeakage('Think about the formula.', true, mockQuestion);
      expect(isSafe).toBe(false);
    });

    it('rejects direct reveal phrasing with single-digit answer (answer is 5, equals 5, therefore 5)', () => {
      expect(validateHintContentLeakage('The answer is 5.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('So answer: 5.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('Therefore 5 is obtained.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('This equals 5.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('Calculation gives 5.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('The final value is 5.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('You should select 5.', false, mockQuestion)).toBe(false);
    });

    it('permits ordinary stem references without reveal context ("5 workers are given")', () => {
      const safeHint = 'Notice that 5 workers are given in the problem statement. Set up the rate equation.';
      const isSafe = validateHintContentLeakage(safeHint, false, mockQuestion);
      expect(isSafe).toBe(true);
    });

    it('rejects option label reveal (Option A, choose A, select A, A is the answer)', () => {
      // For mockQuestion, answer '5' is options[0] -> Option A
      expect(validateHintContentLeakage('Choose Option A.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('You should choose A.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('Select A.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('The answer is A.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('A is the answer.', false, mockQuestion)).toBe(false);
      expect(validateHintContentLeakage('A is correct.', false, mockQuestion)).toBe(false);
    });

    it('rejects percentage and decimal equivalents (21 percent, 0.21 in reveal context)', () => {
      const percentQuestion = {
        question: 'Calculate the rate.',
        options: ['10%', '15%', '21%', '25%'],
        answer: '21%',
      };

      expect(validateHintContentLeakage('The answer is 21%.', false, percentQuestion)).toBe(false);
      expect(validateHintContentLeakage('The answer is 21 percent.', false, percentQuestion)).toBe(false);
      expect(validateHintContentLeakage('The answer is 0.21.', false, percentQuestion)).toBe(false);
      expect(validateHintContentLeakage('Therefore 0.21.', false, percentQuestion)).toBe(false);
    });

    it('rejects fraction decimal equivalents (0.5 for 1/2, 0.4 for 2/5, 0.375 for 3/8)', () => {
      const halfQuestion = {
        question: 'Find the probability.',
        options: ['1/2', '1/3', '1/4', '1/5'],
        answer: '1/2',
      };
      expect(validateHintContentLeakage('The answer is 0.5.', false, halfQuestion)).toBe(false);
      expect(validateHintContentLeakage('Therefore 0.5.', false, halfQuestion)).toBe(false);

      const twoFifthsQuestion = {
        question: 'Find ratio.',
        options: ['2/5', '3/5', '1/5', '4/5'],
        answer: '2/5',
      };
      expect(validateHintContentLeakage('The result is 0.4.', false, twoFifthsQuestion)).toBe(false);

      const threeEighthsQuestion = {
        question: 'Calculate proportion.',
        options: ['3/8', '5/8', '1/8', '7/8'],
        answer: '3/8',
      };
      expect(validateHintContentLeakage('The final value is 0.375.', false, threeEighthsQuestion)).toBe(false);
    });
  });
});
