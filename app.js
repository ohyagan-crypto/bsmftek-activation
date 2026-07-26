const LINE_URL = 'https://line.me/R/ti/p/%40379duufl';

const form = document.querySelector('#activation-form');
const codeInput = document.querySelector('#activation-code');
const clearButton = document.querySelector('#clear-code');
const statusMessage = document.querySelector('#activation-status');
const API_BASE_URL = 'https://easier-dennis-inkjet-following.trycloudflare.com';
const generatorForm = document.querySelector('#generator-form');
const generatorStatus = document.querySelector('#generator-status');
const generatedCode = document.querySelector('#generated-code');
const customDays = document.querySelector('#custom-days');
const copyGeneratedCode = document.querySelector('#copy-generated-code');

function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function normalizeCode(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

function setStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', type === 'error');
}

function validateCode() {
  const code = normalizeCode(codeInput.value);
  codeInput.value = code;
  const valid = /^\d{6}$/.test(code);
  codeInput.setAttribute('aria-invalid', String(!valid));
  return valid ? code : null;
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch (_) {
    codeInput.focus();
    codeInput.select();
    return document.execCommand('copy');
  }
}

codeInput.addEventListener('input', () => {
  codeInput.value = normalizeCode(codeInput.value);
  codeInput.removeAttribute('aria-invalid');
  setStatus('');
});

codeInput.addEventListener('paste', (event) => {
  const pasted = normalizeCode(event.clipboardData?.getData('text'));
  if (!pasted) return;
  event.preventDefault();
  codeInput.value = pasted;
  codeInput.removeAttribute('aria-invalid');
});

clearButton.addEventListener('click', () => {
  codeInput.value = '';
  codeInput.removeAttribute('aria-invalid');
  setStatus('');
  codeInput.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const code = validateCode();
  if (!code) {
    setStatus('請輸入完整的 6 位數驗證碼。', 'error');
    codeInput.focus();
    return;
  }

  const lineWindow = window.open('', '_blank');
  const copied = await copyCode(code);
  if (!copied) {
    setStatus('已開啟 LINE，但瀏覽器未允許自動複製。請回到此頁長按驗證碼複製。', 'error');
  } else {
    setStatus('驗證碼已複製。請在 LINE 對話框貼上並傳送。');
  }

  if (lineWindow) {
    lineWindow.opener = null;
    lineWindow.location.href = LINE_URL;
  } else {
    window.location.href = LINE_URL;
  }
});

window.addEventListener('load', renderIcons);

document.querySelectorAll('input[name="access-days"]').forEach((input) => {
  input.addEventListener('change', () => {
    const custom = input.value === 'custom' && input.checked;
    customDays.disabled = !custom;
    if (custom) customDays.focus();
  });
});

generatorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  generatorStatus.textContent = '';
  generatorStatus.classList.remove('error');
  generatedCode.hidden = true;

  const selected = generatorForm.querySelector('input[name="access-days"]:checked')?.value;
  const accessDays = selected === 'custom' ? Number(customDays.value) : Number(selected);
  const adminKey = document.querySelector('#admin-key').value;
  const label = document.querySelector('#customer-label').value.trim();
  if (!Number.isInteger(accessDays) || accessDays < 1 || accessDays > 3650) {
    generatorStatus.textContent = '請輸入 1 至 3650 天的有效期限。';
    generatorStatus.classList.add('error');
    return;
  }
  if (!adminKey) {
    generatorStatus.textContent = '請輸入管理密碼。';
    generatorStatus.classList.add('error');
    return;
  }
  if (!/^[\x20-\x7E]+$/.test(adminKey)) {
    generatorStatus.textContent = '管理密碼請使用英文、數字或半形符號。';
    generatorStatus.classList.add('error');
    document.querySelector('#admin-key').focus();
    return;
  }
  if (!label) {
    generatorStatus.textContent = '請輸入客戶姓名或備註，方便後續管理。';
    generatorStatus.classList.add('error');
    document.querySelector('#customer-label').focus();
    return;
  }

  const submitButton = generatorForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  generatorStatus.textContent = '正在建立授權碼...';
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/pairing-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify({ accessDays, label })
    });
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { ok: false, error: '授權服務暫時無法連線。' };
    if (!response.ok || !result.ok) throw new Error(result.error || '無法產生授權碼');
    generatedCode.querySelector('strong').textContent = result.code;
    generatedCode.querySelector('small').textContent = `${result.accessDays} 天使用權，授權碼將於 10 分鐘後失效。`;
    generatedCode.hidden = false;
    generatorStatus.textContent = '授權碼已建立，請私下提供給指定客戶。';
    document.querySelector('#admin-key').value = '';
    renderIcons();
  } catch (error) {
    const knownMessage = /管理密碼|授權服務|授權碼/.test(error.message || '')
      ? error.message
      : '授權服務暫時無法使用，請稍後再試。';
    generatorStatus.textContent = knownMessage;
    generatorStatus.classList.add('error');
  } finally {
    submitButton.disabled = false;
  }
});

copyGeneratedCode.addEventListener('click', async () => {
  const code = generatedCode.querySelector('strong').textContent;
  const copied = await copyCode(code);
  generatorStatus.textContent = copied ? '授權碼已複製。' : '無法自動複製，請長按授權碼複製。';
  generatorStatus.classList.toggle('error', !copied);
});
