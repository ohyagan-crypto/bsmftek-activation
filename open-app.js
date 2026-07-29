const APP_LINKS = {
  gmail: { name: 'Gmail', web: 'https://mail.google.com/mail/u/0/#inbox', ios: 'googlegmail://', android: 'com.google.android.gm' },
  outlookMail: { name: 'Outlook', web: 'https://outlook.live.com/mail/0/', ios: 'ms-outlook://', android: 'com.microsoft.office.outlook' },
  googleCalendar: { name: 'Google 行事曆', web: 'https://calendar.google.com/calendar/u/0/r', ios: 'googlecalendar://', android: 'com.google.android.calendar' },
  outlookCalendar: { name: 'Outlook 行事曆', web: 'https://outlook.live.com/calendar/0/view/month', ios: 'ms-outlook://', android: 'com.microsoft.office.outlook' },
  googleDrive: { name: 'Google Drive', web: 'https://drive.google.com/drive/u/0/my-drive', ios: 'googledrive://', android: 'com.google.android.apps.docs' },
  oneDrive: { name: 'OneDrive', web: 'https://onedrive.live.com/', ios: 'ms-onedrive://', android: 'com.microsoft.skydrive' },
  notion: { name: 'Notion', web: 'https://www.notion.so/', ios: 'notion://', android: 'notion.id' },
  googleTasks: { name: 'Google Tasks', web: 'https://tasks.google.com/', ios: 'googletasks://', android: 'com.google.android.apps.tasks' },
  microsoftTodo: { name: 'Microsoft To Do', web: 'https://to-do.office.com/tasks/', ios: 'ms-todo://', android: 'com.microsoft.todos' },
  timeTree: { name: 'TimeTree', web: 'https://timetreeapp.com/', ios: 'timetree://', android: 'works.jubilee.timetree' },
  googleContacts: { name: 'Google 聯絡人', web: 'https://contacts.google.com/', android: 'com.google.android.contacts' },
  slack: { name: 'Slack', web: 'https://app.slack.com/client', ios: 'slack://open', android: 'com.Slack' },
  teams: { name: 'Microsoft Teams', web: 'https://teams.microsoft.com/v2/', ios: 'msteams://', android: 'com.microsoft.teams' },
  whatsapp: { name: 'WhatsApp', web: 'https://www.whatsapp.com/', ios: 'whatsapp://', android: 'com.whatsapp' },
  telegram: { name: 'Telegram', web: 'https://web.telegram.org/', ios: 'tg://', android: 'org.telegram.messenger' },
  discord: { name: 'Discord', web: 'https://discord.com/app', ios: 'discord://', android: 'com.discord' },
  zoom: { name: 'Zoom', web: 'https://zoom.us/join', ios: 'zoomus://', android: 'us.zoom.videomeetings' },
  googleMeet: { name: 'Google Meet', web: 'https://meet.google.com/', ios: 'gmeet://', android: 'com.google.android.apps.tachyon' },
  googleMaps: { name: 'Google Maps', web: 'https://www.google.com/maps', ios: 'comgooglemaps://', android: 'com.google.android.apps.maps' },
  uber: { name: 'Uber', web: 'https://www.uber.com/tw/zh-tw/ride/', ios: 'uber://', android: 'com.ubercab' },
  taiwanTaxi: { name: '55688 台灣大車隊', web: 'https://www.55688taxi.com/', android: 'com.mtaxi.passenger' },
  thsrTex: { name: '台灣高鐵 T-EX', web: 'https://www.thsrc.com.tw/', android: 'tw.com.thsrc.texpress' },
  traEBooking: { name: '台鐵 e 訂通', web: 'https://www.railway.gov.tw/tra-tip-web/tip/tip00C/tipC16/view10', android: 'tw.gov.tra.twtraffic' },
  youBike: { name: 'YouBike', web: 'https://www.youbike.com.tw/region/main/', android: 'tw.com.youbike.app' },
  busPlus: { name: 'Bus+', web: 'https://busplus.app/', android: 'hearsilent.busplus' },
  youtube: { name: 'YouTube', web: 'https://www.youtube.com/', ios: 'youtube://', android: 'com.google.android.youtube' },
  shopee: { name: '蝦皮購物', web: 'https://shopee.tw/', ios: 'shopeetw://', android: 'com.shopee.tw' },
  momo: { name: 'momo 購物', web: 'https://www.momoshop.com.tw/', android: 'com.momo.mobile.shoppingv2.android' },
  pchome: { name: 'PChome 24h', web: 'https://24h.pchome.com.tw/', android: 'com.pchome24h' },
  foodpanda: { name: 'foodpanda', web: 'https://www.foodpanda.com.tw/', ios: 'foodpanda://', android: 'com.global.foodpanda.android' },
  uberEats: { name: 'Uber Eats', web: 'https://www.ubereats.com/tw', ios: 'ubereats://', android: 'com.ubercab.eats' },
  booking: { name: 'Booking.com', web: 'https://www.booking.com/', ios: 'booking://', android: 'com.booking' },
  agoda: { name: 'Agoda', web: 'https://www.agoda.com/', ios: 'agoda://', android: 'com.agoda.mobile.consumer' },
  trip: { name: 'Trip.com', web: 'https://tw.trip.com/', ios: 'ctrip://', android: 'ctrip.english' },
  klook: { name: 'Klook', web: 'https://www.klook.com/zh-TW/', ios: 'klook://', android: 'com.klook' },
  airbnb: { name: 'Airbnb', web: 'https://www.airbnb.com.tw/', ios: 'airbnb://', android: 'com.airbnb.android' },
  dropbox: { name: 'Dropbox', web: 'https://www.dropbox.com/home', android: 'com.dropbox.android' },
  trello: { name: 'Trello', web: 'https://trello.com/', ios: 'trello://', android: 'com.trello' },
  asana: { name: 'Asana', web: 'https://app.asana.com/', ios: 'asana://', android: 'com.asana.app' },
  canva: { name: 'Canva', web: 'https://www.canva.com/', ios: 'canva://', android: 'com.canva.editor' },
  adobeAcrobat: { name: 'Adobe Acrobat', web: 'https://acrobat.adobe.com/', android: 'com.adobe.reader' },
  nhiIos: { name: '健保快易通', web: 'https://apps.apple.com/tw/app/id578186283' },
  nhiAndroid: { name: '健保快易通', web: 'https://play.google.com/store/apps/details?id=com.nhiApp.v1&hl=zh_TW', android: 'com.nhiApp.v1' },
  fidoIos: { name: '行動自然人憑證', web: 'https://apps.apple.com/tw/app/id1462866416' },
  fidoAndroid: { name: '行動自然人憑證', web: 'https://play.google.com/store/apps/details?id=tw.gov.moi.tfido&hl=zh_TW', android: 'tw.gov.moi.tfido' },
  linePay: { name: 'LINE Pay', web: 'https://pay.line.me/portal/tw/main', ios: 'line://pay', android: 'jp.naver.line.android' },
  jkoPay: { name: '街口支付', web: 'https://www.jkopay.com/', ios: 'jkos://', android: 'com.jkos.app' },
  pxPayPlus: { name: '全支付', web: 'https://www.pxpayplus.com/' },
  easyWallet: { name: '悠遊付', web: 'https://easywallet.easycard.com.tw/', ios: 'easywallet://', android: 'tw.com.easycard.wallet' },
  invoiceIos: { name: '財政部統一發票兌獎', web: 'https://apps.apple.com/tw/app/id1445981329' },
  invoiceAndroid: { name: '財政部統一發票兌獎', web: 'https://play.google.com/store/apps/details?id=tw.gov.invoice&hl=zh_TW', android: 'tw.gov.invoice' }
};

const params = new URLSearchParams(window.location.search);
const app = APP_LINKS[params.get('app') || ''];
const autoStart = params.get('autostart') !== '0';
const appName = document.querySelector('#app-name');
const status = document.querySelector('#status');
const openAppButton = document.querySelector('#open-app');
const openWebLink = document.querySelector('#open-web');
let fallbackTimer = null;

function androidIntent(webUrl, packageName) {
  const target = new URL(webUrl);
  const route = `${target.host}${target.pathname}${target.search}${target.hash}`;
  return `intent://${route}#Intent;scheme=${target.protocol.replace(':', '')};package=${packageName};S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
}

function appTarget() {
  const agent = navigator.userAgent || '';
  if (/Android/i.test(agent) && app.android) return androidIntent(app.web, app.android);
  if (/(?:iPhone|iPad|iPod)/i.test(agent) && app.ios) return app.ios;
  return app.web;
}

function cancelFallback() {
  if (fallbackTimer) window.clearTimeout(fallbackTimer);
  fallbackTimer = null;
}

function openInstalledApp() {
  const target = appTarget();
  status.textContent = `正在開啟 ${app.name}...`;
  if (target === app.web || target.startsWith('intent://')) {
    window.location.href = target;
    return;
  }

  window.location.href = target;
  cancelFallback();
  fallbackTimer = window.setTimeout(() => {
    if (document.visibilityState === 'visible') window.location.replace(app.web);
  }, 1600);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') cancelFallback();
});

if (!app) {
  appName.textContent = '找不到 APP';
  status.textContent = '這個 APP 入口無效，請回到蝦咩重新開啟。';
  openAppButton.hidden = true;
  openWebLink.hidden = true;
} else {
  document.title = `${app.name}｜藍星科技`;
  appName.textContent = app.name;
  openWebLink.href = app.web;
  openAppButton.addEventListener('click', openInstalledApp);
  if (autoStart) window.setTimeout(openInstalledApp, 80);
  else status.textContent = `已準備開啟 ${app.name}。`;
}
