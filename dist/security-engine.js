import { scanText } from './privacy-engine.js';

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'csv', 'json', 'log', 'xml', 'html', 'htm', 'css',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'yaml', 'yml', 'ini', 'env'
]);

const EXECUTABLE_EXTENSIONS = new Set([
  'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'ps1', 'vbs', 'jar',
  'apk', 'app', 'dmg', 'pkg', 'deb', 'rpm'
]);

const MACRO_EXTENSIONS = new Set(['docm', 'xlsm', 'pptm', 'xlam']);
const ARCHIVE_EXTENSIONS = new Set(['zip', 'rar', '7z', 'iso', 'img', 'tar', 'gz']);
const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rebrand.ly']);
const TRACKING_PARAMS = /^(utm_.+|fbclid|gclid|msclkid|mc_cid|mc_eid)$/i;
const SECRET_PARAMS = /^(token|access_token|api[_-]?key|secret|password|passwd|auth|signature|sig|session|jwt)$/i;
const REDIRECT_PARAMS = /^(url|redirect|redirect_uri|redirect_url|next|continue|return|return_to|target|dest|destination)$/i;

const CONTENT_RULES = [
  {
    id: 'script-tag',
    label: 'Executable script block',
    severity: 'high',
    weight: 28,
    regex: /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
    replacement: '<!-- [SCRIPT_BLOCK_REMOVED_BY_PROMPTSHIELD] -->'
  },
  {
    id: 'inline-script',
    label: 'Inline browser script',
    severity: 'high',
    weight: 24,
    regex: /\s(?:onerror|onload|onclick|onmouseover|onfocus)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    replacement: ' [INLINE_SCRIPT_REMOVED]'
  },
  {
    id: 'javascript-url',
    label: 'JavaScript URL',
    severity: 'critical',
    weight: 36,
    regex: /javascript\s*:[^\s"'<>]+/gi,
    replacement: '[JAVASCRIPT_URL_REMOVED]'
  },
  {
    id: 'dynamic-code',
    label: 'Dynamic code execution',
    severity: 'high',
    weight: 28,
    regex: /\b(?:eval|Function)\s*\([^)]{0,500}\)/gi,
    replacement: '[DYNAMIC_CODE_REMOVED]'
  },
  {
    id: 'shell-command',
    label: 'High-risk shell command',
    severity: 'critical',
    weight: 38,
    regex: /(?:powershell(?:\.exe)?\s+(?:-[a-z]+\s+)*(?:-enc|-encodedcommand)\b[^\r\n]*|(?:curl|wget)\b[^\r\n|]{0,300}\|\s*(?:sh|bash)\b|\brm\s+-rf\s+[^\r\n]+)/gi,
    replacement: '[HIGH_RISK_COMMAND_REMOVED]'
  },
  {
    id: 'redirect-code',
    label: 'Forced redirect code',
    severity: 'medium',
    weight: 18,
    regex: /(?:window\.)?location(?:\.href)?\s*=\s*["'][^"']+["']/gi,
    replacement: '[FORCED_REDIRECT_REMOVED]'
  },
  {
    id: 'obfuscated-payload',
    label: 'Encoded or obfuscated payload',
    severity: 'medium',
    weight: 20,
    regex: /\b(?:atob\s*\(|fromCharCode\s*\(|base64_decode\s*\()[^\r\n]{20,500}/gi,
    replacement: '[OBFUSCATED_PAYLOAD_REMOVED]'
  }
];

function levelFor(score) {
  return score === 0 ? 'safe' : score < 30 ? 'low' : score < 60 ? 'medium' : 'high';
}

function makeFinding(id, label, severity, weight, count = 1, detail = '') {
  return { id, label, severity, weight, count, detail };
}

function countMatches(text, regex) {
  return [...String(text).matchAll(new RegExp(regex.source, regex.flags))].length;
}

export function getFileExtension(name = '') {
  const clean = String(name).toLowerCase().split(/[?#]/)[0];
  const part = clean.includes('.') ? clean.split('.').pop() : '';
  return part || '';
}

export function sanitizeFileName(name = 'cleaned-file.txt') {
  const withoutControls = String(name).replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
  return withoutControls.replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/\s+/g, '-').slice(0, 120) || 'cleaned-file.txt';
}

export function analyzeFileMetadata(file = {}) {
  const name = sanitizeFileName(file.name || 'unnamed-file');
  const lowerName = name.toLowerCase();
  const extension = getFileExtension(lowerName);
  const size = Number(file.size || 0);
  const findings = [];

  if (EXECUTABLE_EXTENSIONS.has(extension)) {
    findings.push(makeFinding('executable-file', 'Executable or installable file', 'critical', 55, 1, `.${extension} files can run code on a device.`));
  }
  if (MACRO_EXTENSIONS.has(extension)) {
    findings.push(makeFinding('macro-file', 'Macro-enabled office file', 'high', 35, 1, 'Macros can execute actions when a document is opened.'));
  }
  if (ARCHIVE_EXTENSIONS.has(extension)) {
    findings.push(makeFinding('archive-file', 'Archive or disk image', 'medium', 16, 1, 'Compressed contents cannot be inspected by this browser-only scanner.'));
  }
  if (/\.(?:pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|gif|txt)\.(?:exe|msi|bat|cmd|scr|ps1|vbs|jar)$/i.test(lowerName)) {
    findings.push(makeFinding('double-extension', 'Misleading double extension', 'critical', 48, 1, 'The name may be disguising an executable file.'));
  }
  if (/[\u202a-\u202e\u2066-\u2069]/.test(String(file.name || ''))) {
    findings.push(makeFinding('bidi-filename', 'Hidden filename direction control', 'critical', 45, 1, 'Direction-control characters can disguise the real extension.'));
  }
  if (size > 2 * 1024 * 1024) {
    findings.push(makeFinding('large-file', 'File exceeds local content-scan limit', 'low', 8, 1, 'Only metadata will be checked above 2 MB.'));
  }

  const inspectable = TEXT_EXTENSIONS.has(extension) && size <= 2 * 1024 * 1024;
  if (!inspectable && findings.length === 0) {
    findings.push(makeFinding('content-not-inspected', 'Content not inspected', 'low', 6, 1, 'This file type is not supported for safe browser text inspection.'));
  }

  const score = Math.min(100, findings.reduce((sum, item) => sum + item.weight, 0));
  return { name, extension, size, inspectable, findings, score, level: levelFor(score), total: findings.reduce((sum, item) => sum + item.count, 0) };
}

export function analyzeUrl(input = '') {
  const raw = String(input).trim();
  const findings = [];
  if (!raw) return { normalizedUrl: '', safeUrl: '', findings, score: 0, level: 'safe', total: 0 };

  if (/^(?:javascript|data|file|vbscript):/i.test(raw)) {
    findings.push(makeFinding('dangerous-protocol', 'Dangerous link protocol', 'critical', 65, 1, 'Do not open this link in a browser.'));
    return { normalizedUrl: raw, safeUrl: '', findings, score: 65, level: 'high', total: 1 };
  }

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    findings.push(makeFinding('invalid-url', 'Invalid or incomplete link', 'high', 45, 1, 'The address could not be safely parsed.'));
    return { normalizedUrl: raw, safeUrl: '', findings, score: 45, level: 'medium', total: 1 };
  }

  const host = url.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol)) findings.push(makeFinding('unusual-protocol', 'Unusual link protocol', 'critical', 55));
  if (url.protocol === 'http:') findings.push(makeFinding('no-https', 'Connection is not HTTPS', 'medium', 18));
  if (url.username || url.password || raw.includes('@')) findings.push(makeFinding('embedded-credentials', 'Credentials or deceptive @ symbol in link', 'critical', 38));
  if (host.includes('xn--')) findings.push(makeFinding('punycode-domain', 'Punycode / lookalike domain', 'high', 32));
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) findings.push(makeFinding('ip-host', 'Direct IP address instead of domain', 'medium', 18));
  if (SHORTENERS.has(host)) findings.push(makeFinding('shortened-link', 'Shortened destination', 'medium', 18));
  if (host.split('.').length > 4) findings.push(makeFinding('many-subdomains', 'Unusually deep subdomain', 'low', 9));
  if ((raw.match(/%[0-9a-f]{2}/gi) || []).length > 4 || /%25[0-9a-f]{2}/i.test(raw)) findings.push(makeFinding('encoded-link', 'Heavily encoded address', 'medium', 16));
  if (/(?:login|verify|secure|account|update|wallet|payment|gift|bonus)[.-]/i.test(host)) findings.push(makeFinding('deceptive-domain-words', 'Trust-bait words in domain', 'medium', 18));

  let secretCount = 0;
  let trackingCount = 0;
  let redirectCount = 0;
  const safeUrl = new URL(url.toString());
  safeUrl.username = '';
  safeUrl.password = '';
  [...safeUrl.searchParams.keys()].forEach(key => {
    if (SECRET_PARAMS.test(key)) {
      secretCount += 1;
      safeUrl.searchParams.set(key, '[REDACTED]');
    } else if (TRACKING_PARAMS.test(key)) {
      trackingCount += 1;
      safeUrl.searchParams.delete(key);
    }
    if (REDIRECT_PARAMS.test(key)) redirectCount += 1;
  });
  if (secretCount) findings.push(makeFinding('secret-query', 'Secret or session value in link', 'critical', 38, secretCount));
  if (trackingCount) findings.push(makeFinding('tracking-parameters', 'Tracking parameters removed', 'low', 4, trackingCount));
  if (redirectCount) findings.push(makeFinding('redirect-parameter', 'Hidden redirect destination', 'medium', 16, redirectCount));

  const score = Math.min(100, findings.reduce((sum, item) => sum + item.weight + Math.max(0, item.count - 1) * 4, 0));
  const canReturnSafeUrl = ['http:', 'https:'].includes(url.protocol);
  return {
    normalizedUrl: url.toString(),
    safeUrl: canReturnSafeUrl ? safeUrl.toString() : '',
    hostname: host,
    findings,
    score,
    level: levelFor(score),
    total: findings.reduce((sum, item) => sum + item.count, 0)
  };
}

export function scanFileContent(content = '', filename = 'file.txt') {
  const text = String(content);
  const privacy = scanText(text);
  const securityFindings = [];
  let cleaned = privacy.sanitized;

  CONTENT_RULES.forEach(rule => {
    const count = countMatches(text, rule.regex);
    if (!count) return;
    securityFindings.push(makeFinding(rule.id, rule.label, rule.severity, rule.weight, count));
    cleaned = cleaned.replace(new RegExp(rule.regex.source, rule.regex.flags), rule.replacement);
  });

  const links = text.match(/(?:https?:\/\/|www\.)[^\s"'<>]+/gi) || [];
  const riskyLinks = links.map(link => analyzeUrl(link)).filter(result => result.score >= 30);
  if (riskyLinks.length) {
    securityFindings.push(makeFinding('risky-links', 'Risky links inside file', 'high', 28, riskyLinks.length));
    riskyLinks.forEach(result => {
      cleaned = cleaned.split(result.normalizedUrl).join('[RISKY_LINK_REMOVED]');
      const withoutScheme = result.normalizedUrl.replace(/^https?:\/\//i, '');
      cleaned = cleaned.split(withoutScheme).join('[RISKY_LINK_REMOVED]');
    });
  }

  const findings = [...securityFindings, ...privacy.findings];
  const securityScore = securityFindings.reduce((sum, item) => sum + item.weight + Math.max(0, item.count - 1) * 4, 0);
  const score = Math.min(100, Math.max(privacy.score, securityScore + Math.round(privacy.score * 0.5)));
  const total = findings.reduce((sum, item) => sum + item.count, 0);
  const originalName = sanitizeFileName(filename);
  const dot = originalName.lastIndexOf('.');
  const cleanedName = dot > 0
    ? `${originalName.slice(0, dot)}.cleaned${originalName.slice(dot)}`
    : `${originalName}.cleaned.txt`;

  return { cleaned, cleanedName, findings, score, level: levelFor(score), total, privacyCount: privacy.total, securityCount: securityFindings.reduce((sum, item) => sum + item.count, 0) };
}

export { CONTENT_RULES, TEXT_EXTENSIONS };
