'use strict';

/**
 * tests/security/passwordHashing.test.js
 *
 * Security test suite for password hashing, normalization, policy and verification.
 */

const authService = require('../../src/services/authService');
const authConfig = require('../../src/config/authConfig');

describe('Security: Password Hashing & Verification Contract', () => {
  const validPassword = 'Correct-Horse-Battery-Staple-2026!';

  it('scrypt parameters match frozen architecture (N=16384, r=8, p=5, keylen=64, salt=16)', () => {
    expect(authConfig.SCRYPT_PARAMS.N).toBe(16384);
    expect(authConfig.SCRYPT_PARAMS.r).toBe(8);
    expect(authConfig.SCRYPT_PARAMS.p).toBe(5);
    expect(authConfig.SCRYPT_PARAMS.maxmem).toBe(128 * 1024 * 1024);
    expect(authConfig.SCRYPT_SALT_BYTES).toBe(16);
    expect(authConfig.SCRYPT_KEYLEN_BYTES).toBe(64);
  });

  it('hashes passwords into canonical $scrypt$ format', async () => {
    const hash = await authService.hashPassword(validPassword);
    expect(typeof hash).toBe('string');
    expect(hash.startsWith('$scrypt$v=1$N=16384,r=8,p=5$')).toBe(true);

    const parts = hash.split('$');
    // ['', 'scrypt', 'v=1', 'N=16384,r=8,p=5', '<saltB64>', '<derivedKeyB64>']
    expect(parts.length).toBe(6);
    const saltBuf = Buffer.from(parts[4], 'hex');
    const keyBuf = Buffer.from(parts[5], 'hex');
    expect(saltBuf.length).toBe(16);
    expect(keyBuf.length).toBe(64);
  });

  it('verifies valid password with canonical signature verifyPassword(password, encodedHash)', async () => {
    const hash = await authService.hashPassword(validPassword);
    const isValid = await authService.verifyPassword(validPassword, hash);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await authService.hashPassword(validPassword);
    const isValid = await authService.verifyPassword('Wrong-Password-Battery-2026!', hash);
    expect(isValid).toBe(false);
  });

  it('proves argument order: verifyPassword(candidatePassword, storedHash) works and reversed call returns false', async () => {
    const hash = await authService.hashPassword(validPassword);
    // Correct order
    expect(await authService.verifyPassword(validPassword, hash)).toBe(true);
    // Reversed order: candidate password passed as argument 2, hash passed as argument 1
    // The second argument is treated as encodedHash, which fails parsing
    expect(await authService.verifyPassword(hash, validPassword)).toBe(false);
  });

  it('enforces NFC normalization: decomposed unicode matches precomposed unicode', async () => {
    const precomposed = 'café-secure-password-2026!'; // NFC
    const decomposed = 'cafe\u0301-secure-password-2026!'; // NFD

    expect(precomposed).not.toBe(decomposed);
    expect(precomposed.normalize('NFC')).toBe(decomposed.normalize('NFC'));

    const hash = await authService.hashPassword(precomposed);
    // Decomposed form should verify against precomposed hash due to NFC normalization
    const matches = await authService.verifyPassword(decomposed, hash);
    expect(matches).toBe(true);
  });

  it('enforces password length boundaries (15 - 128 Unicode code points)', async () => {
    const tooShort = 'short-pass-123'; // 14 chars
    expect([...tooShort].length).toBe(14);
    await expect(authService.hashPassword(tooShort)).rejects.toThrow();

    const minValid = '123456789012345'; // 15 chars
    expect([...minValid].length).toBe(15);
    await expect(authService.hashPassword(minValid)).resolves.toBeDefined();

    const maxValid = 'a'.repeat(128); // 128 chars
    expect([...maxValid].length).toBe(128);
    await expect(authService.hashPassword(maxValid)).resolves.toBeDefined();

    const tooLong = 'a'.repeat(129); // 129 chars
    expect([...tooLong].length).toBe(129);
    await expect(authService.hashPassword(tooLong)).rejects.toThrow();
  });

  it('handles malformed hash strings gracefully without throwing unhandled exceptions', async () => {
    const malformedHashes = [
      '',
      null,
      undefined,
      '$scrypt$malformed',
      '$scrypt$v=1$invalid$salt$key',
      '$bcrypt$v=1$...',
      'plain_text_string'
    ];

    for (const badHash of malformedHashes) {
      const result = await authService.verifyPassword(validPassword, badHash);
      expect(result).toBe(false);
    }
  });

  it('dummy scrypt timing path executes without throwing and returns false', async () => {
    const result = await authService.verifyPassword('AnyCandidatePassword', authConfig.DUMMY_PASSWORD_HASH);
    expect(result).toBe(false);
  });
});
