'use strict';

/**
 * tests/import_safety.test.js
 *
 * Automated tests for clean import safety invariants (Section 9):
 *  - Refuses clean import when database name is unexpected (not adaptive_aptitude)
 *  - Refuses clean import when NODE_ENV is production
 *  - Refuses clean import when --clean is not explicitly provided
 *  - Confirms import never executes dropDatabase()
 *  - Confirms import clears only the questions collection
 */

const fs = require('fs');
const path = require('path');
const { validateImportSafeguards, EXPECTED_DB_NAME } = require('../scripts/importQuestions');

describe('Clean Import Safety Safeguards', () => {
  const validOpts = {
    dbName: EXPECTED_DB_NAME,
    env: 'development',
    isClean: true,
  };

  it('passes safeguards when all safety criteria are satisfied', () => {
    expect(() => validateImportSafeguards(validOpts)).not.toThrow();
  });

  it('refuses destructive import when --clean flag is missing', () => {
    expect(() =>
      validateImportSafeguards({
        ...validOpts,
        isClean: false,
      })
    ).toThrow(/missing --clean authorization flag/);
  });

  it('refuses destructive import when NODE_ENV is production', () => {
    expect(() =>
      validateImportSafeguards({
        ...validOpts,
        env: 'production',
      })
    ).toThrow(/NODE_ENV=production/);
  });

  it('refuses destructive import when connected database is unexpected', () => {
    expect(() =>
      validateImportSafeguards({
        ...validOpts,
        dbName: 'production_main_db',
      })
    ).toThrow(/connected database is "production_main_db", expected "adaptive_aptitude"/);
  });

  it('refuses destructive import when connected to admin or test database without explicit configuration', () => {
    expect(() =>
      validateImportSafeguards({
        ...validOpts,
        dbName: 'admin',
      })
    ).toThrow(/expected "adaptive_aptitude"/);
  });

  describe('Static codebase analysis of import scripts', () => {
    const importScriptPath = path.resolve(__dirname, '..', 'scripts', 'importQuestions.js');
    const importScriptContent = fs.readFileSync(importScriptPath, 'utf8');

    it('confirms dropDatabase() is never called in scripts/importQuestions.js', () => {
      expect(importScriptContent).not.toMatch(/\.dropDatabase\s*\(/);
    });

    it('confirms Question.deleteMany({}) is used to clear only the questions collection', () => {
      expect(importScriptContent).toMatch(/Question\.deleteMany\s*\(\s*\{\s*\}\s*\)/);
    });
  });
});
