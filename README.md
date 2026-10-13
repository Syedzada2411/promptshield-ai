# PromptShield AI

> Scan prompts, supported text files and links locally—before you share, open or trust them.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_PromptShield-30e6bd?style=for-the-badge)](https://promptshield-ai.pinkcup1.chatgpt.site/)
[![Tests](https://img.shields.io/badge/tests-13_passing-30e6bd?style=flat-square)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-64a8ff.svg?style=flat-square)](LICENSE)
[![Privacy: Local](https://img.shields.io/badge/privacy-local--only-30e6bd?style=flat-square)](#safety-model)

PromptShield AI is a free, open-source privacy and security pre-check. It catches visible privacy leaks and common suspicious patterns entirely inside the browser. The interface is available in English and Roman Urdu.

## What it helps with

### Prompt and text privacy

- Detects common emails, Pakistani phone numbers, CNICs, payment cards, IP addresses, API keys and secret-filled URLs
- Replaces exposed values with readable placeholders
- Creates a clearer prompt while preserving redactions

### File pre-check and cleaning

- Checks every selected file's name, extension and size without executing it
- Warns about executable, macro-enabled, archive, misleading double-extension and hidden-direction filenames
- Inspects supported text/code files up to 2 MB
- Finds private data, script blocks, inline scripts, JavaScript URLs, risky shell commands, redirects and obfuscation patterns
- Creates a cleaned local copy for the user to review and download

Supported content inspection: `.txt`, `.md`, `.csv`, `.json`, `.log`, `.xml`, `.html`, `.htm`, `.css`, `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx`, `.yaml`, `.yml`, `.ini`, `.env`.

### Link signal check

- Analyzes a URL as text and never visits its destination
- Explains visible signals such as dangerous protocols, HTTP, embedded credentials, punycode, direct IP hosts, URL shorteners, deep subdomains, heavy encoding, trust-bait domain words, secret parameters and redirects
- Removes common tracking parameters and redacts visible secret query values from the returned copy

### Account safety checklist

A private, local checklist covers passkeys/2FA, unique passwords, active sessions, browser extensions and recovery options. PromptShield never asks for a password, cookie, recovery code or account login.

## Safety model

| Action | PromptShield behavior |
|---|---|
| Upload content | Never |
| Execute a selected file | Never |
| Visit a checked link | Never |
| Access a browser account | Never |
| Store prompts or file content | Never |
| Save settings | Language and checklist state only, in local browser storage |

### Honest limitation

PromptShield is **not a full antivirus, executable sandbox, threat-intelligence/reputation database, breached-password checker or protection guarantee**. Binary and unsupported files receive metadata warnings only. Use maintained antivirus software, operating-system updates, backups and strong account security controls alongside this tool.

## Use it

1. Open the [live app](https://promptshield-ai.pinkcup1.chatgpt.site/).
2. Select **Prompt / text**, **File check** or **Link check**.
3. Add one item and run the local check.
4. Review every warning and the stated limitation.
5. Copy or download cleaned text only after reviewing it.

## Run locally

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

## Testing

```bash
npm run check
```

The automated suite covers privacy redaction, payment-card validation, safe text, prompt improvement, link cleanup, dangerous URL schemes, risky filenames, unsupported binaries and file-content cleaning.

## Project structure

```text
dist/
  index.html             Application interface
  styles.css             Responsive visual system
  app.js                 Browser interactions and English/Roman Urdu UI
  privacy-engine.js      Sensitive-data detection and redaction
  security-engine.js     File metadata/content and URL signal checks
tests/
  privacy-engine.test.mjs
  security-engine.test.mjs
.github/                  Community and funding configuration
```

## International sponsorship roadmap

PromptShield is maintained by **Syed Areeb Ali** under the **AI Tool Insider** initiative. Responsible international sponsorship will support:

- more safely inspectable text formats and detection rules;
- accessibility and additional clear-language explanations;
- independent security review and test coverage;
- community safety guides for students, freelancers and small teams;
- keeping the core browser checks free and open source.

[Sponsor the roadmap](https://github.com/sponsors/Syedzada2411), star the project, report a reproducible issue, or contribute a tested improvement.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md). Report security concerns through [SECURITY.md](SECURITY.md), and never place real private information in a public issue.

## License

MIT © 2026 Syed Areeb Ali
