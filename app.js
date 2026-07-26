const LINE_URL = 'https://line.me/R/ti/p/%40379duufl';

const form = document.querySelector('#activation-form');
const codeInput = document.querySelector('#activation-code');
const clearButton = document.querySelector('#clear-code');
const statusMessage = document.querySelector('#activation-status');

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
