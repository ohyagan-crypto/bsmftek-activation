const CONFIG_URL = './activation-api.json';

const generatorForm = document.querySelector('#generator-form');
const generatorStatus = document.querySelector('#generator-status');
const generatedCode = document.querySelector('#generated-code');
const customDays = document.querySelector('#custom-days');
const copyGeneratedCode = document.querySelector('#copy-generated-code');
const featureWbs = document.querySelector('#feature-wbs');
const featureGithub = document.querySelector('#feature-github');
const featureSdVideo = document.querySelector('#feature-sd-video');
const sdCredits = document.querySelector('#sd-credits');
const sdCreditPreview = document.querySelector('#sd-credit-preview');
const customerLabel = document.querySelector('#customer-label');
const adminKeyInput = document.querySelector('#admin-key');
const rememberAdminKey = document.querySelector('#remember-admin-key');
const forgetAdminKey = document.querySelector('#forget-admin-key');

const CREDENTIAL_DATABASE = 'bsmftek-activation';
const CREDENTIAL_STORE = 'encrypted-settings';
const CREDENTIAL_KEY_RECORD = 'admin-key-encryption-key';
const CREDENTIAL_VALUE_RECORD = 'admin-key-ciphertext';
let credentialDatabasePromise;

const SD_CREDITS_PER_SECOND = 9;
const SD_MIN_DURATION_SECONDS = 5;
const SD_MAX_DURATION_SECONDS = 15;
const MIN_SD_RECHARGE_TWD = 36;

function updateSdCreditPreview() {
  const amount = Math.max(0, Number(sdCredits.value || 0));
  const seconds = Math.min(SD_MAX_DURATION_SECONDS, Math.floor(amount / SD_CREDITS_PER_SECOND));
  const usableText = seconds >= SD_MIN_DURATION_SECONDS
    ? `目前可製作最長 ${seconds} 秒影片。`
    : `製作 ${SD_MIN_DURATION_SECONDS} 秒影片需 ${SD_MIN_DURATION_SECONDS * SD_CREDITS_PER_SECOND} 積分。`;
  sdCreditPreview.textContent = `1 元 = 1 積分；單次最低儲值 ${MIN_SD_RECHARGE_TWD} 元。${usableText}`;
}

function syncCustomDaysState(focus = false) {
  const selected = generatorForm.querySelector('input[name="access-days"]:checked')?.value;
  const custom = selected === 'custom';
  customDays.disabled = !custom;
  if (custom && focus) customDays.focus();
}

function syncSdRechargeState(focus = false) {
  sdCredits.disabled = !featureSdVideo.checked;
  if (featureSdVideo.checked) {
    if (Number(sdCredits.value) < MIN_SD_RECHARGE_TWD) {
      sdCredits.value = String(SD_MIN_DURATION_SECONDS * SD_CREDITS_PER_SECOND);
    }
    if (focus) sdCredits.focus();
  } else {
    sdCredits.value = '0';
  }
  updateSdCreditPreview();
}

function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function setStatus(message, type = '') {
  generatorStatus.textContent = message;
  generatorStatus.className = `status-message${type ? ` ${type}` : ''}`;
}

function openCredentialDatabase() {
  if (!window.indexedDB || !window.crypto?.subtle) {
    return Promise.reject(new Error('credential-storage-unavailable'));
  }
  if (!credentialDatabasePromise) {
    credentialDatabasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(CREDENTIAL_DATABASE, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(CREDENTIAL_STORE)) {
          request.result.createObjectStore(CREDENTIAL_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('credential-database-open-failed'));
    });
  }
  return credentialDatabasePromise;
}

async function readCredentialRecord(recordName) {
  const database = await openCredentialDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CREDENTIAL_STORE, 'readonly');
    const request = transaction.objectStore(CREDENTIAL_STORE).get(recordName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('credential-read-failed'));
  });
}

async function writeCredentialRecord(recordName, value) {
  const database = await openCredentialDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CREDENTIAL_STORE, 'readwrite');
    transaction.objectStore(CREDENTIAL_STORE).put(value, recordName);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('credential-write-failed'));
  });
}

async function clearRememberedAdminKey() {
  const database = await openCredentialDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CREDENTIAL_STORE, 'readwrite');
    const store = transaction.objectStore(CREDENTIAL_STORE);
    store.delete(CREDENTIAL_KEY_RECORD);
    store.delete(CREDENTIAL_VALUE_RECORD);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('credential-delete-failed'));
  });
}

async function saveRememberedAdminKey(adminKey) {
  let encryptionKey = await readCredentialRecord(CREDENTIAL_KEY_RECORD);
  if (!encryptionKey) {
    encryptionKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    await writeCredentialRecord(CREDENTIAL_KEY_RECORD, encryptionKey);
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    new TextEncoder().encode(adminKey)
  );
  await writeCredentialRecord(CREDENTIAL_VALUE_RECORD, {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  });
}

async function loadRememberedAdminKey() {
  const encryptionKey = await readCredentialRecord(CREDENTIAL_KEY_RECORD);
  const encrypted = await readCredentialRecord(CREDENTIAL_VALUE_RECORD);
  if (!encryptionKey || !encrypted?.iv || !encrypted?.ciphertext) return '';

  const plaintext = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    encryptionKey,
    new Uint8Array(encrypted.ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}

async function restoreRememberedAdminKey() {
  try {
    const savedAdminKey = await loadRememberedAdminKey();
    if (!savedAdminKey) return;
    adminKeyInput.value = savedAdminKey;
    rememberAdminKey.checked = true;
    forgetAdminKey.hidden = false;
  } catch (_) {
    forgetAdminKey.hidden = true;
  }
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
  input.addEventListener('change', () => syncCustomDaysState(true));
});

featureSdVideo.addEventListener('change', () => {
  syncSdRechargeState(true);
});
sdCredits.addEventListener('input', updateSdCreditPreview);

rememberAdminKey.addEventListener('change', async () => {
  if (rememberAdminKey.checked) return;
  try {
    await clearRememberedAdminKey();
  } catch (_) {
    // The current form can still be used even when browser storage is unavailable.
  }
  forgetAdminKey.hidden = true;
});

forgetAdminKey.addEventListener('click', async () => {
  try {
    await clearRememberedAdminKey();
  } catch (_) {
    // Keep the visible result deterministic even if browser storage was already cleared.
  }
  adminKeyInput.value = '';
  rememberAdminKey.checked = false;
  forgetAdminKey.hidden = true;
  setStatus('已清除這台裝置記住的管理密碼。', 'success');
  adminKeyInput.focus();
});

generatorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');
  generatedCode.hidden = true;

  const selected = generatorForm.querySelector('input[name="access-days"]:checked')?.value;
  const accessDays = selected === 'custom' ? Number(customDays.value) : Number(selected);
  const adminKey = adminKeyInput.value;
  const label = customerLabel.value.trim();
  const featureAccess = {
    wbs: featureWbs.checked,
    github: featureGithub.checked,
    sdVideo: featureSdVideo.checked,
    sdCredits: featureSdVideo.checked ? Number(sdCredits.value) : 0
  };

  if (!Number.isInteger(accessDays) || accessDays < 1 || accessDays > 3650) {
    setStatus('請輸入 1 至 3650 天的有效期限。', 'error');
    return;
  }
  if (!Number.isInteger(featureAccess.sdCredits)
    || featureAccess.sdCredits < (featureAccess.sdVideo ? MIN_SD_RECHARGE_TWD : 0)
    || featureAccess.sdCredits > 100000) {
    setStatus(`SD 儲值單次最低 ${MIN_SD_RECHARGE_TWD} 元，上限 100000 元；1 元等於 1 積分。`, 'error');
    sdCredits.focus();
    return;
  }
  if (!adminKey) {
    setStatus('請輸入管理密碼。', 'error');
    adminKeyInput.focus();
    return;
  }
  if (!/^[\x20-\x7E]+$/.test(adminKey)) {
    setStatus('管理密碼請使用英文、數字或半形符號。', 'error');
    adminKeyInput.focus();
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
      body: JSON.stringify({ accessDays, label, featureAccess })
    });
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { ok: false, error: '授權服務回應格式錯誤。' };

    if (!response.ok || !result.ok) throw new Error(result.error || '無法產生授權碼。');
    generatedCode.querySelector('strong').textContent = result.code;
    const granted = [];
    if (result.featureAccess?.wbs) granted.push('WBS');
    if (result.featureAccess?.github) granted.push('GitHub');
    if (result.featureAccess?.sdVideo) granted.push(`SD 影片儲值 ${result.featureAccess.sdCredits} 積分（NT$${result.featureAccess.sdCredits}）`);
    generatedCode.querySelector('small').textContent = `同一 LINE 帳號 30 天內限開通一次；本碼只能綁定一個帳號。${result.accessDays} 天使用權；${granted.length ? `已開通：${granted.join('、')}` : '未開通進階功能'}。授權碼將於 10 分鐘後失效。`;
    generatedCode.hidden = false;
    let credentialSaved = false;
    if (rememberAdminKey.checked) {
      try {
        await saveRememberedAdminKey(adminKey);
        credentialSaved = true;
        forgetAdminKey.hidden = false;
      } catch (_) {
        credentialSaved = false;
      }
    } else {
      try {
        await clearRememberedAdminKey();
      } catch (_) {
        // The authorization code was still created successfully.
      }
      adminKeyInput.value = '';
      forgetAdminKey.hidden = true;
    }
    setStatus(
      rememberAdminKey.checked && !credentialSaved
        ? '授權碼已建立，但這個瀏覽器無法記住管理密碼。'
        : `授權碼已建立${credentialSaved ? '，管理密碼已記住' : ''}，請私下提供給指定客戶。`,
      'success'
    );
    renderIcons();
  } catch (error) {
    const message = String(error.message || '');
    const knownMessage = /管理密碼|授權服務|授權碼|最新|SD|儲值|積分/.test(message)
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

window.addEventListener('load', () => {
  renderIcons();
  syncCustomDaysState();
  syncSdRechargeState();
  restoreRememberedAdminKey();
});

window.addEventListener('pageshow', () => {
  syncCustomDaysState();
  syncSdRechargeState();
});
