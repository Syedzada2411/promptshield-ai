const RULES = [
  {
    id: 'api-key',
    label: 'API key / secret',
    severity: 'critical',
    weight: 35,
    placeholder: '[API_KEY_REDACTED]',
    regex: /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{8,}["']?)/gi
  },
  {
    id: 'email',
    label: 'Email address',
    severity: 'high',
    weight: 20,
    placeholder: '[EMAIL_REDACTED]',
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  },
  {
    id: 'cnic',
    label: 'Pakistan CNIC',
    severity: 'critical',
    weight: 35,
    placeholder: '[CNIC_REDACTED]',
    regex: /(?<!\d)\d{5}-?\d{7}-?\d(?!\d)/g
  },
  {
    id: 'phone',
    label: 'Phone number',
    severity: 'high',
    weight: 20,
    placeholder: '[PHONE_REDACTED]',
    regex: /(?<!\w)(?:\+?92[\s-]?|0)?3\d{2}[\s-]?\d{7}(?!\d)|(?<!\w)\+[1-9]\d{0,2}[\s.-]?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}(?!\w)/g
  },
  {
    id: 'ipv4',
    label: 'IP address',
    severity: 'medium',
    weight: 12,
    placeholder: '[IP_REDACTED]',
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
  },
  {
    id: 'secret-url',
    label: 'Secret in URL',
    severity: 'critical',
    weight: 30,
    placeholder: '[PRIVATE_URL_REDACTED]',
    regex: /https?:\/\/[^\s]+[?&](?:token|key|secret|password|signature|auth)=[^\s&#]+/gi
  }
];

function luhnCheck(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function collectMatches(text, rule) {
  const regex = new RegExp(rule.regex.source, rule.regex.flags);
  return [...text.matchAll(regex)].map(match => ({
    value: match[0],
    index: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length
  }));
}

function collectCards(text) {
  const regex = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g;
  return [...text.matchAll(regex)]
    .filter(match => luhnCheck(match[0]))
    .map(match => ({
      value: match[0],
      index: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length
    }));
}

export function scanText(input = '') {
  const text = String(input);
  const findings = [];

  RULES.forEach(rule => {
    const matches = collectMatches(text, rule);
    if (matches.length) findings.push({ ...rule, matches, count: matches.length });
  });

  const cardMatches = collectCards(text);
  if (cardMatches.length) {
    findings.push({
      id: 'payment-card',
      label: 'Payment card',
      severity: 'critical',
      weight: 35,
      placeholder: '[CARD_REDACTED]',
      matches: cardMatches,
      count: cardMatches.length
    });
  }

  const candidates = findings.flatMap(finding => finding.matches.map(match => ({
    ...match,
    placeholder: finding.placeholder,
    weight: finding.weight
  })));
  candidates.sort((a, b) => a.index - b.index || b.end - b.index - (a.end - a.index) || b.weight - a.weight);
  const replacements = [];
  candidates.forEach(candidate => {
    const overlaps = replacements.some(existing => candidate.index < existing.end && candidate.end > existing.index);
    if (!overlaps) replacements.push(candidate);
  });

  replacements.sort((a, b) => b.index - a.index);
  let sanitized = text;
  replacements.forEach(item => {
    sanitized = `${sanitized.slice(0, item.index)}${item.placeholder}${sanitized.slice(item.end)}`;
  });

  const score = Math.min(100, findings.reduce((total, finding) => total + finding.weight + Math.max(0, finding.count - 1) * 5, 0));
  const level = score === 0 ? 'safe' : score < 30 ? 'low' : score < 60 ? 'medium' : 'high';
  const total = findings.reduce((sum, finding) => sum + finding.count, 0);

  return { sanitized, findings, score, level, total };
}

const TYPE_GUIDANCE = {
  general: 'Give a clear, accurate response. State assumptions and ask one clarifying question only if essential.',
  email: 'Write a concise, professional email with a clear subject, natural tone, and specific call to action.',
  research: 'Separate verified facts from assumptions. Organize the answer into findings, evidence, and limitations.',
  code: 'Explain the likely cause, provide a minimal fix, and include a short verification checklist.',
  content: 'Create engaging content with a strong opening hook, useful body, clear CTA, and audience-appropriate tone.'
};

export function improvePrompt(sanitizedText, type = 'general') {
  const cleaned = String(sanitizedText).trim();
  if (!cleaned) return '';
  const guidance = TYPE_GUIDANCE[type] || TYPE_GUIDANCE.general;
  return `GOAL\n${cleaned}\n\nREQUIREMENTS\n- ${guidance}\n- Do not invent missing private information.\n- Keep every redacted placeholder unchanged.\n\nOUTPUT\n- Use clear headings and actionable steps.\n- Keep the response concise unless detail is requested.`;
}

export { RULES, luhnCheck };
