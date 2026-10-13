import { scanText, improvePrompt } from './privacy-engine.js?v=1.0.1';

const $ = selector => document.querySelector(selector);
const promptInput = $('#promptInput');
const scanButton = $('#scanButton');
const sampleButton = $('#sampleButton');
const clearButton = $('#clearButton');
const charCount = $('#charCount');
const promptType = $('#promptType');
const emptyState = $('#emptyState');
const resultContent = $('#resultContent');
const findingList = $('#findingList');
const findingCount = $('#findingCount');
const safeOutput = $('#safeOutput');
const improvedOutput = $('#improvedOutput');
const riskScore = $('#riskScore');
const riskMeter = $('#riskMeter');
const toast = $('#toast');

let currentSafeText = '';
let currentImprovedText = '';
let currentLanguage = localStorage.getItem('promptshield-language') || 'en';

const translations = {
  en: {
    eyebrow: 'Free • Open source • Local-first', heroLine1: 'Share prompts.', heroLine2: 'Not private data.',
    heroText: 'PromptShield finds sensitive information before it reaches ChatGPT, Gemini, Claude, or any other AI tool. Your text never leaves this browser.',
    startButton: 'Protect a prompt →', learnButton: 'See how it works', noLogin: 'No login', noApi: 'No API key', noUpload: 'No text uploaded', localScan: 'LOCAL SCAN', risk: 'RISK',
    workspaceKicker: 'PRIVATE WORKSPACE', workspaceTitle: 'Clean your prompt in seconds', browserOnly: 'Processing stays in your browser',
    inputTitle: 'Paste your prompt', sample: 'Try sample', clear: 'Clear', inputPrivacy: 'Input is never stored', promptTypeLabel: 'Prompt type',
    typeGeneral: 'General', typeEmail: 'Email', typeResearch: 'Research', typeCode: 'Code / debugging', typeContent: 'Content creation', scanButton: 'Scan & protect',
    resultsTitle: 'Review protected output', riskScore: 'Risk score', emptyTitle: 'Ready when you are', emptyText: 'Paste a prompt and run a local scan. Findings will appear here.',
    foundLabel: 'Sensitive items found', protectionLabel: 'Protection', safePrompt: 'Safe prompt', improvedPrompt: 'Improved prompt', copySafe: 'Copy safe prompt', download: 'Download .txt', copyImproved: 'Copy improved prompt',
    disclaimer: 'PromptShield catches common patterns, but no automated scanner is perfect. Always review the result before sharing it.',
    howKicker: 'BUILT FOR EVERYDAY AI USE', howTitle: 'Private by design, simple by default', featureOneTitle: 'Detect', featureOneText: 'Find emails, phone numbers, CNICs, cards, IP addresses, API keys and secret-filled URLs.',
    featureTwoTitle: 'Protect', featureTwoText: 'Replace private values with clear placeholders while keeping your prompt useful.', featureThreeTitle: 'Improve', featureThreeText: 'Turn the safe text into a structured prompt with a goal, requirements, and output format.',
    privacyKicker: 'ZERO-SERVER PRIVACY', privacyTitle: 'Your prompt stays yours.', privacyText: 'The scanner runs entirely in your browser using transparent pattern-matching rules. There is no account, analytics payload, prompt database, or external AI request.',
    privacyOne: 'Works without an AI API', privacyTwo: 'No prompt history or tracking', privacyThree: 'Readable, auditable open-source code',
    openKicker: 'OPEN SOURCE, PUBLIC BENEFIT', openTitle: 'Help make everyday AI safer.', openText: 'PromptShield AI is maintained by Syed Areeb Ali under the AI Tool Insider initiative. Contributions, translations, testing, and responsible sponsorships help keep it free.',
    starGithub: 'Star on GitHub ↗', supportProject: 'Support the project', protected: 'Protected', clean: 'No sensitive pattern found', copied: 'Copied to clipboard', downloaded: 'Safe prompt downloaded', addText: 'Add some text before scanning.'
  },
  ur: {
    eyebrow: 'مفت • اوپن سورس • مکمل مقامی', heroLine1: 'پرامپٹ شیئر کریں۔', heroLine2: 'ذاتی معلومات نہیں۔',
    heroText: 'PromptShield آپ کی حساس معلومات کو ChatGPT، Gemini، Claude یا کسی دوسرے AI ٹول تک پہنچنے سے پہلے تلاش کرتا ہے۔ آپ کا متن اس براؤزر سے باہر نہیں جاتا۔',
    startButton: 'پرامپٹ محفوظ کریں ←', learnButton: 'کام کرنے کا طریقہ', noLogin: 'لاگ اِن نہیں', noApi: 'API key نہیں', noUpload: 'متن اپلوڈ نہیں ہوتا', localScan: 'مقامی اسکین', risk: 'خطرہ',
    workspaceKicker: 'پرائیویٹ ورک اسپیس', workspaceTitle: 'چند سیکنڈ میں پرامپٹ صاف کریں', browserOnly: 'تمام پراسیسنگ آپ کے براؤزر میں',
    inputTitle: 'اپنا پرامپٹ پیسٹ کریں', sample: 'مثال آزمائیں', clear: 'صاف کریں', inputPrivacy: 'متن محفوظ نہیں کیا جاتا', promptTypeLabel: 'پرامپٹ کی قسم',
    typeGeneral: 'عام', typeEmail: 'ای میل', typeResearch: 'تحقیق', typeCode: 'کوڈ / ڈیبگنگ', typeContent: 'کانٹینٹ', scanButton: 'اسکین اور محفوظ کریں',
    resultsTitle: 'محفوظ نتیجہ دیکھیں', riskScore: 'خطرے کا اسکور', emptyTitle: 'اسکین کے لیے تیار', emptyText: 'پرامپٹ پیسٹ کرکے مقامی اسکین چلائیں۔ نتائج یہاں نظر آئیں گے۔',
    foundLabel: 'حساس معلومات', protectionLabel: 'حفاظت', safePrompt: 'محفوظ پرامپٹ', improvedPrompt: 'بہتر پرامپٹ', copySafe: 'محفوظ پرامپٹ کاپی کریں', download: '.txt ڈاؤن لوڈ', copyImproved: 'بہتر پرامپٹ کاپی کریں',
    disclaimer: 'PromptShield عام پیٹرنز تلاش کرتا ہے، مگر کوئی خودکار اسکینر کامل نہیں۔ شیئر کرنے سے پہلے نتیجہ ضرور دیکھیں۔',
    howKicker: 'روزمرہ AI استعمال کے لیے', howTitle: 'ڈیزائن سے پرائیویٹ، استعمال میں آسان', featureOneTitle: 'تلاش', featureOneText: 'ای میل، فون، CNIC، کارڈ، IP، API keys اور خفیہ URLs تلاش کریں۔',
    featureTwoTitle: 'حفاظت', featureTwoText: 'ذاتی معلومات کو واضح placeholders سے بدلیں اور پرامپٹ کو کارآمد رکھیں۔', featureThreeTitle: 'بہتری', featureThreeText: 'محفوظ متن کو مقصد، ضروریات اور آؤٹ پٹ کے ساتھ منظم پرامپٹ بنائیں۔',
    privacyKicker: 'سرور کے بغیر پرائیویسی', privacyTitle: 'آپ کا پرامپٹ صرف آپ کا۔', privacyText: 'اسکینر واضح پیٹرن رولز کے ذریعے مکمل طور پر آپ کے براؤزر میں چلتا ہے۔ کوئی اکاؤنٹ، ٹریکنگ، ڈیٹابیس یا بیرونی AI درخواست نہیں۔',
    privacyOne: 'AI API کے بغیر کام کرتا ہے', privacyTwo: 'پرامپٹ ہسٹری یا ٹریکنگ نہیں', privacyThree: 'واضح اور قابلِ جانچ اوپن سورس کوڈ',
    openKicker: 'اوپن سورس، عوامی فائدہ', openTitle: 'روزمرہ AI کو محفوظ بنانے میں مدد کریں۔', openText: 'PromptShield AI کو Syed Areeb Ali، AI Tool Insider کے تحت برقرار رکھتے ہیں۔ تعاون، ترجمہ، ٹیسٹنگ اور ذمہ دار sponsorship اسے مفت رکھنے میں مدد دیتے ہیں۔',
    starGithub: 'GitHub پر Star کریں ↗', supportProject: 'پروجیکٹ سپورٹ کریں', protected: 'محفوظ', clean: 'کوئی حساس پیٹرن نہیں ملا', copied: 'کلپ بورڈ پر کاپی ہوگیا', downloaded: 'محفوظ پرامپٹ ڈاؤن لوڈ ہوگیا', addText: 'اسکین سے پہلے کچھ متن شامل کریں۔'
  }
};

function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage === 'ur' ? 'ur' : 'en';
  document.documentElement.dir = currentLanguage === 'ur' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (translations[currentLanguage][key]) element.textContent = translations[currentLanguage][key];
  });
  $('#languageToggle').textContent = currentLanguage === 'en' ? 'اردو' : 'EN';
  promptInput.placeholder = currentLanguage === 'en'
    ? 'Example: Email the report to alex@example.com and use API key sk-demo1234567890...'
    : 'مثال: رپورٹ alex@example.com پر بھیجیں اور API key sk-demo1234567890 استعمال کریں...';
  localStorage.setItem('promptshield-language', currentLanguage);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function renderFindings(result) {
  findingList.innerHTML = result.findings.length
    ? result.findings.map(finding => `<span class="finding-chip ${finding.severity}"><i></i>${escapeHtml(finding.label)} <b>${finding.count}</b></span>`).join('')
    : `<span class="finding-chip safe"><i></i>${escapeHtml(t('clean'))}</span>`;
}

function runScan() {
  const input = promptInput.value.trim();
  if (!input) {
    showToast(t('addText'));
    promptInput.focus();
    return;
  }
  scanButton.classList.add('scanning');
  scanButton.disabled = true;
  window.setTimeout(() => {
    const result = scanText(input);
    currentSafeText = result.sanitized;
    currentImprovedText = improvePrompt(result.sanitized, promptType.value);
    safeOutput.textContent = currentSafeText;
    improvedOutput.textContent = currentImprovedText;
    findingCount.textContent = result.total;
    $('#protectionStatus').textContent = result.total ? t('protected') : t('clean');
    riskScore.textContent = result.score;
    riskMeter.dataset.level = result.level;
    renderFindings(result);
    emptyState.hidden = true;
    resultContent.hidden = false;
    scanButton.classList.remove('scanning');
    scanButton.disabled = false;
  }, 280);
}

async function copyText(value) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const helper = document.createElement('textarea');
    helper.value = value;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }
  showToast(t('copied'));
}

function setTab(tabName) {
  const safeActive = tabName === 'safe';
  $('#safeTab').classList.toggle('active', safeActive);
  $('#safeTab').setAttribute('aria-selected', String(safeActive));
  $('#improvedTab').classList.toggle('active', !safeActive);
  $('#improvedTab').setAttribute('aria-selected', String(!safeActive));
  $('#safePanel').hidden = !safeActive;
  $('#safePanel').classList.toggle('active', safeActive);
  $('#improvedPanel').hidden = safeActive;
  $('#improvedPanel').classList.toggle('active', !safeActive);
}

promptInput.addEventListener('input', () => { charCount.textContent = promptInput.value.length; });
promptInput.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runScan();
});
scanButton.addEventListener('click', runScan);
sampleButton.addEventListener('click', () => {
  promptInput.value = 'Draft a project update for client Sara. Email: sara.khan@example.com, phone: +92 300 1234567, CNIC: 42101-1234567-1. The staging server is 192.168.1.42 and the API key is sk-demoKey1234567890.';
  charCount.textContent = promptInput.value.length;
  promptType.value = 'email';
  promptInput.focus();
});
clearButton.addEventListener('click', () => {
  promptInput.value = '';
  charCount.textContent = '0';
  resultContent.hidden = true;
  emptyState.hidden = false;
  riskScore.textContent = '0';
  riskMeter.dataset.level = 'safe';
  currentSafeText = '';
  currentImprovedText = '';
});
$('#copySafeButton').addEventListener('click', () => copyText(currentSafeText));
$('#copyImprovedButton').addEventListener('click', () => copyText(currentImprovedText));
$('#safeTab').addEventListener('click', () => setTab('safe'));
$('#improvedTab').addEventListener('click', () => setTab('improved'));
$('#downloadButton').addEventListener('click', () => {
  if (!currentSafeText) return;
  const blob = new Blob([currentSafeText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'promptshield-safe-prompt.txt';
  link.click();
  URL.revokeObjectURL(url);
  showToast(t('downloaded'));
});
$('#languageToggle').addEventListener('click', () => {
  currentLanguage = currentLanguage === 'en' ? 'ur' : 'en';
  applyLanguage();
});
$('#themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  $('#themeToggle').textContent = document.body.classList.contains('light-theme') ? '☾' : '☼';
});

document.querySelector('#year').textContent = new Date().getFullYear();
applyLanguage();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}
