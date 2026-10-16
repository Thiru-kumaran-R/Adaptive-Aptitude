// src/test/unit/markdownSanitizer.security.test.ts
import { describe, it, expect } from 'vitest';
import { renderSanitizedMarkdown } from '../../utils/markdownSanitizer';

describe('markdownSanitizer (ACC-14: XSS Sanitization Pipeline)', () => {
  it('strips malicious <script> tags completely', () => {
    const maliciousInput = 'Normal text <script>alert("XSS")</script> more text';
    const output = renderSanitizedMarkdown(maliciousInput);

    expect(output).not.toContain('<script>');
    expect(output).not.toContain('alert("XSS")');
    expect(output).toContain('Normal text');
    expect(output).toContain('more text');
  });

  it('strips inline event handler attributes like onerror, onload, and onclick', () => {
    const maliciousImg = '<img src="invalid.jpg" onerror="alert(document.cookie)" />';
    const output = renderSanitizedMarkdown(maliciousImg);

    expect(output).not.toContain('onerror');
    expect(output).not.toContain('alert');
  });

  it('neutralizes dangerous javascript: URIs in hyperlinks', () => {
    const maliciousLink = '[Click me](javascript:alert("pwned"))';
    const output = renderSanitizedMarkdown(maliciousLink);

    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('alert');
  });

  it('strips <iframe> and <object> tags', () => {
    const iframePayload = '<iframe src="https://evil.example.com"></iframe>';
    const output = renderSanitizedMarkdown(iframePayload);

    expect(output).not.toContain('<iframe');
    expect(output).not.toContain('evil.example.com');
  });

  it('preserves legitimate mathematical and explanatory markdown formatting', () => {
    const safeContent = `
# Formula Overview
For any quantity **Q** and percentage **P%**:
- *Formula:* \`P% of Q = (P / 100) * Q\`
- Step 1: Divide by 100
- Step 2: Multiply by base
`;
    const output = renderSanitizedMarkdown(safeContent);

    expect(output).toContain('<strong>Q</strong>');
    expect(output).toContain('<em>Formula:</em>');
    expect(output).toContain('<code>P% of Q = (P / 100) * Q</code>');
    expect(output).toContain('<li>');
  });
});
