import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText, improvePrompt, luhnCheck } from '../dist/privacy-engine.js';

test('detects and redacts common sensitive values', () => {
  const input = 'Contact alex@example.com, +92 300 1234567, CNIC 42101-1234567-1 and key sk-exampleKey123456789.';
  const result = scanText(input);
  assert.equal(result.total, 4);
  assert.match(result.sanitized, /\[EMAIL_REDACTED\]/);
  assert.match(result.sanitized, /\[PHONE_REDACTED\]/);
  assert.match(result.sanitized, /\[CNIC_REDACTED\]/);
  assert.match(result.sanitized, /\[API_KEY_REDACTED\]/);
  assert.equal(result.level, 'high');
});

test('recognizes valid payment cards using Luhn check', () => {
  assert.equal(luhnCheck('4111 1111 1111 1111'), true);
  assert.equal(luhnCheck('4111 1111 1111 1112'), false);
  const result = scanText('Charge 4111 1111 1111 1111 for the subscription.');
  assert.match(result.sanitized, /\[CARD_REDACTED\]/);
});

test('redacts IP addresses and signed URLs', () => {
  const result = scanText('Server 192.168.1.42 and https://example.com/file?token=supersecret123');
  assert.match(result.sanitized, /\[IP_REDACTED\]/);
  assert.match(result.sanitized, /\[PRIVATE_URL_REDACTED\]/);
  assert.equal(result.sanitized.includes('supersecret123'), false);
});

test('does not double-classify a CNIC as a phone number', () => {
  const result = scanText('Reference CNIC 42101-1234567-1 only.');
  assert.equal(result.findings.filter(item => item.id === 'cnic').length, 1);
  assert.equal(result.findings.filter(item => item.id === 'phone').length, 0);
  assert.equal(result.total, 1);
});

test('returns safe state for ordinary text', () => {
  const result = scanText('Write a friendly product description for a reusable bottle.');
  assert.equal(result.total, 0);
  assert.equal(result.score, 0);
  assert.equal(result.level, 'safe');
  assert.equal(result.sanitized, 'Write a friendly product description for a reusable bottle.');
});

test('improved prompt preserves redaction placeholders', () => {
  const output = improvePrompt('Email [EMAIL_REDACTED] with the project update.', 'email');
  assert.match(output, /\[EMAIL_REDACTED\]/);
  assert.match(output, /GOAL/);
  assert.match(output, /REQUIREMENTS/);
  assert.match(output, /OUTPUT/);
});
