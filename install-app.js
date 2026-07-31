const installButton = document.querySelector('#install-button');
const installLabel = document.querySelector('#install-label');
const openShamie = document.querySelector('#open-shamie');
const pageTitle = document.querySelector('#page-title');
const status = document.querySelector('#status');
const deviceLabel = document.querySelector('#device-label');
const iosSteps = document.querySelector('#ios-steps');
const inAppSteps = document.querySelector('#in-app-steps');
const openBrowser = document.querySelector('#open-browser');
const notificationArea = document.querySelector('#notification-area');
const notificationButton = document.querySelector('#notification-button');
const notificationStatus = document.querySelector('#notification-status');

const userAgent = navigator.userAgent || '';
const isIos = /iPhone|iPad|iPod/i.test(userAgent);
const isAndroid = /Android/i.test(userAgent);
const isLineBrowser = /Line\//i.test(userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let deferredInstallPrompt = null;

const SHAMIE_LINE_URL = 'https://line.me/R/ti/p/%40379duufl';
openShamie.href = SHAMIE_LINE_URL;

function deviceName() {
  if (isIos) return 'iPhone／iPad';
  if (isAndroid) return 'Android 手機／平板';
  return '電腦版瀏覽器';
}

function setInstallReady(message = '可以安裝到主畫面，之後可直接開啟。') {
  installButton.disabled = false;
  installLabel.textContent = '安裝蝦咩 APP';
  status.textContent = message;
}

function setInstalledState() {
  document.body.classList.add('is-installed');
  installButton.hidden = true;
  iosSteps.hidden = true;
  inAppSteps.hidden = true;
  deviceLabel.textContent = '已安裝';
  pageTitle.textContent = '蝦咩已安裝';
  status.textContent = '現在可以直接開啟蝦咩。';
  notificationArea.hidden = false;
}

function showManualInstall() {
  setInstallReady(isIos
    ? '依照下方步驟加入主畫面。'
    : '請從瀏覽器選單完成安裝。');
  iosSteps.hidden = !isIos;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
  } catch (_) {
    status.textContent = '目前瀏覽器無法完成安裝，請更新瀏覽器後再試。';
    return null;
  }
}

async function installApp() {
  if (isLineBrowser) {
    inAppSteps.hidden = false;
    status.textContent = 'LINE 內建瀏覽器無法直接安裝，請改用手機瀏覽器開啟。';
    return;
  }

  if (!deferredInstallPrompt) {
    showManualInstall();
    return;
  }

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (choice.outcome === 'accepted') {
    status.textContent = '正在完成安裝...';
    installButton.disabled = true;
  } else {
    setInstallReady('尚未安裝，準備好時可再次點擊。');
  }
}

async function enableNotifications() {
  if (!('Notification' in window)) {
    notificationStatus.textContent = '這個瀏覽器不支援通知。';
    notificationButton.disabled = true;
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    notificationStatus.textContent = permission === 'denied'
      ? '通知目前已關閉，可到裝置設定重新開啟。'
      : '尚未開啟通知。';
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('蝦咩通知已開啟', {
    body: '之後可在這台裝置接收蝦咩的網頁通知。',
    icon: './assets/shamie-app-192.png',
    badge: './assets/shamie-app-192.png',
    tag: 'shamie-notification-ready'
  });
  notificationStatus.textContent = '即時通知已開啟。';
  notificationButton.disabled = true;
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (!isStandalone && !isLineBrowser) setInstallReady();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  setInstalledState();
});

installButton.addEventListener('click', installApp);
notificationButton.addEventListener('click', enableNotifications);

deviceLabel.textContent = deviceName();
if (isAndroid) {
  const current = new URL(window.location.href);
  openBrowser.href = `intent://${current.host}${current.pathname}${current.search}#Intent;scheme=https;package=com.android.chrome;end`;
}

registerServiceWorker().then(() => {
  if (isStandalone) {
    setInstalledState();
  } else if (isLineBrowser) {
    setInstallReady('請先用手機瀏覽器開啟，再安裝到主畫面。');
    inAppSteps.hidden = false;
  } else if (isIos) {
    showManualInstall();
  } else {
    window.setTimeout(() => {
      if (!deferredInstallPrompt) showManualInstall();
    }, 900);
  }
});
