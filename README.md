# PromptShield AI

> Protect private data before sharing prompts with AI.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_PromptShield-30e6bd?style=for-the-badge)](https://promptshield-ai.pinkcup1.chatgpt.site/)
[![Tests](https://img.shields.io/badge/tests-5_passing-30e6bd?style=flat-square)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-64a8ff.svg?style=flat-square)](LICENSE)
[![Privacy: Local](https://img.shields.io/badge/privacy-local--only-30e6bd?style=flat-square)](#privacy-model)

PromptShield AI is a free, open-source prompt privacy tool. It detects common sensitive-data patterns, replaces them with readable placeholders, scores the risk, and creates a clearer prompt—all inside the browser.

## Why this exists

People routinely paste emails, phone numbers, customer details, API keys, internal IP addresses, and signed URLs into AI tools. PromptShield adds a quick safety checkpoint without requiring an account, server, or external AI API.

## Features

- Local detection for emails, Pakistani phone numbers, CNICs, payment cards, IP addresses, API keys, secrets, and secret-filled URLs
- One-click redaction with readable placeholders
- Risk score and categorized findings
- Safe-prompt and structured-prompt output
- English and Urdu interface
- Dark and light themes
- Download and clipboard tools
- Installable progressive web app
- Responsive and accessible interface
- Zero dependencies and no build step

## Privacy model

- Prompt text is processed in the visitor's browser.
- No prompt content is uploaded by the application.
- No account or AI API key is required.
- Prompt history is not stored.
- Settings such as language may be saved locally in the browser.

No pattern-based scanner is perfect. Users should review the output before sharing it.

## Run locally

```bash
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`.

## Testing

```bash
npm test
```

The suite covers multi-pattern redaction, payment-card validation, secret URLs, safe text, and improved-prompt placeholder preservation.

## Project structure

```text
dist/
  index.html            Application interface
  styles.css            Responsive visual system
  app.js                Browser interactions and bilingual UI
  privacy-engine.js     Detection, scoring, redaction, prompt improvement
tests/
  privacy-engine.test.mjs
.github/                 Community and funding configuration
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Useful contributions include new detection rules with tests, accessibility improvements, translations, documentation, and privacy review.

## Security

Please report security concerns responsibly by following [SECURITY.md](SECURITY.md). Do not open a public issue containing real sensitive information.

## Support the project

PromptShield is maintained by **Syed Areeb Ali** under the **AI Tool Insider** initiative. Stars, testing, translations, documentation, and sponsorships help keep the tool free.

- [Sponsor Syedzada2411](https://github.com/sponsors/Syedzada2411)
- Share the live tool with students, freelancers, and small teams
- Open a useful issue or contribute a tested improvement

## License

MIT © 2026 Syed Areeb Ali
