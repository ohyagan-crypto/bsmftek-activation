const CONFIG_URL = './activation-api.json';

const generatorForm = document.querySelector('#generator-form');
const generatorStatus = document.querySelector('#generator-status');
const generatedCode = document.querySelector('#generated-code');
const customDays = document.querySelector('#custom-days');
const copyGeneratedCode = document.querySelector('#copy-generated-code');

function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function setStatus(message, type = '') {
  generatorStatus.textContent = message;
  generatorStatus.className = `status-message${type ? ` ${type}` : ''}`;
}

async function resolveApiBaseUrl() {
  const response = await fetch(`${CONFIG_URL}?time=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error('無法取得最新授權服務設定，請重新整理後再試。');

  const config = await response.json();
  const endpoint = new URL(String(config.apiBaseUrl || ''));
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.trycloudflare.com')) {
    throw new Error('授權服務設定無效，請稍後再試。');
  }
  return endpoint.origin;
}

async function verifyApiBaseUrl(apiBaseUrl) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error('授權服務目前無法連線。');
    const result = await response.json();
    if (result.status !== 'ok' || result.service !== 'line-bsmftek-relay') {
      throw new Error('授權服務目前無法連線。');
    }
  } finally {
    window.clearTimeout(timeout);
  }
}

async function resolveHealthyApiBaseUrl() {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const apiBaseUrl = await resolveApiBaseUrl();
      await verifyApiBaseUrl(apiBaseUrl);
      return apiBaseUrl;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 1200));
    }
  }
  throw lastError || new Error('授權服務目前無法連線。');
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (_) {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    textArea.remove();
    return copied;
  }
}

document.querySelectorAll('input[name="access-days"]').forEach((input) => {
  input.addEventListener('change', () => {
    const custom = input.value === 'custom' && input.checked;
    customDays.disabled = !custom;
    if (custom) customDays.focus();
  });
});

generatorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');
  generatedCode.hidden = true;

  const selected = generatorForm.querySelector('input[name="access-days"]:checked')?.value;
  const accessDays = selected === 'custom' ? Number(customDays.value) : Number(selected);
  const adminKey = document.querySelector('#admin-key').value;
  const label = document.querySelector('#customer-label').value.trim();

  if (!Number.isInteger(accessDays) || accessDays < 1 || accessDays > 3650) {
    setStatus('請輸入 1 至 3650 天的有效期限。', 'error');
    return;
  }
  if (!label) {
    setStatus('請輸入客戶姓名或備註。', 'error');
    document.querySelector('#customer-label').focus();
    return;
  }
  if (!adminKey) {
    setStatus('請輸入管理密碼。', 'error');
    document.querySelector('#admin-key').focus();
    return;
  }
  if (!/^[\x20-\x7E]+$/.test(adminKey)) {
    setStatus('管理密碼請使用英文、數字或半形符號。', 'error');
    document.querySelector('#admin-key').focus();
    return;
  }

  const submitButton = generatorForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus('正在建立授權碼...', 'working');

  try {
    const apiBaseUrl = await resolveHealthyApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/admin/pairing-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      },
      body: JSON.stringify({ accessDays, label })
    });
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { ok: false, error: '授權服務回應格式錯誤。' };

    if (!response.ok || !result.ok) throw new Error(result.error || '無法產生授權碼。');
    generatedCode.querySelector('strong').textContent = result.code;
    generatedCode.querySelector('small').textContent = `${result.accessDays} 天使用權，授權碼將於 10 分鐘後失效。`;
    generatedCode.hidden = false;
    document.querySelector('#admin-key').value = '';
    setStatus('授權碼已建立，請私下提供給指定客戶。', 'success');
    renderIcons();
  } catch (error) {
    const message = String(error.message || '');
    const knownMessage = /管理密碼|授權服務|授權碼|最新/.test(message)
      ? message
      : '授權服務連線失敗，請重新整理後再試。';
    setStatus(knownMessage, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

copyGeneratedCode.addEventListener('click', async () => {
  const code = generatedCode.querySelector('strong').textContent;
  const copied = await copyText(code);
  setStatus(copied ? '授權碼已複製。' : '無法自動複製，請長按授權碼複製。', copied ? 'success' : 'error');
});

window.addEventListener('load', renderIcons);
