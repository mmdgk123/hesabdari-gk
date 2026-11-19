/* ══════════════════════════════════════════════════════════
   حساب‌یار ۴.۰ — app logic
   داده‌ها در localStorage · تاریخ شمسی · بدون سرور
   ══════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ────────────────────────── constants ────────────────────────── */
var VERSION = '4.3';

var SK = {
  entries: 'dakhel_entries',
  debts:   'dakhel_debts',
  bal:     'dakhel_bal',
  accs:    'dakhel_accs',
  theme:   'dakhel_theme',
  budget:  'dakhel_budget',
  last:    'dakhel_last',
  rates:   'rates'
};

var MONTHS = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
var MONTHS_SHORT = ['', 'فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف'];
var WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
var WEEKDAY_INITIALS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

var COLOR_ORDER = ['slate', 'blue', 'amber', 'mint', 'violet', 'rose', 'orange', 'bronze', 'pink', 'cyan'];
var OLD_COLORS = {
  melat: 'slate', sad: 'blue', cash: 'amber', pur: 'violet', grn: 'mint',
  red: 'rose', org: 'orange', brn: 'bronze', pink: 'pink', sky: 'cyan'
};
var DEFAULT_ACCOUNTS = [
  { id: 'melat', name: 'ملت',    icon: '💳', color: 'slate' },
  { id: 'sad',   name: 'صادرات', icon: '💳', color: 'blue'  },
  { id: 'cash',  name: 'نقدی',   icon: '💵', color: 'amber' }
];

var ICON_RULES = [
  [['نان', 'نون', 'بقالی', 'سوپر', 'خرید', 'میوه', 'قصابی', 'گوشت', 'خواربار'], '🛒'],
  [['اسنپ', 'تپسی', 'تاکسی', 'بنزین', 'مترو', 'اتوبوس', 'پارکینگ', 'سفر', 'بلیت'], '🚗'],
  [['قبض', 'برق', 'آب', 'گاز', 'تلفن', 'شارژ', 'اینترنت', 'رومینگ'], '🧾'],
  [['دارو', 'دکتر', 'پزشک', 'بیمارستان', 'درمان', 'دندان'], '💊'],
  [['باشگاه', 'سالن', 'سانس', 'استخر', 'ورزش'], '🏋️'],
  [['رستوران', 'کافه', 'غذا', 'فست', 'پیتزا', 'کباب', 'بیرون‌بر'], '🍽️'],
  [['اجاره', 'ودیعه', 'رهن', 'خانه'], '🏠'],
  [['لباس', 'پوشاک', 'کفش'], '👕'],
  [['آرایشگاه', 'ارایشگاه'], '✂️'],
  [['هدیه', 'گیفت', 'کادو'], '🎁'],
  [['قرض', 'دینار', 'وام', 'چک'], '🤝'],
  [['حقوق', 'درآمد', 'دستمزد', 'فروش', 'پاداش'], '💰'],
  [['سوخت'], '⛽'],
  [['عینک', 'لوازم'], '🧴']
];

var CATS = ['خرید', 'حمل‌ونقل', 'قبض و شارژ', 'درمان', 'ورزش', 'رستوران',
            'خانه', 'پوشاک', 'آرایش', 'هدیه', 'وام و قرض', 'درآمد', 'سوخت', 'لوازم'];

var RATES_URL = 'https://mmdgk123.github.io/hesabdari-rates/rates.json';
var RATES_META = {
  geram18:        { icon: '🥇', name: 'گرم طلای ۱۸ عیار', div: 10, unit: 'تومان' },
  price_dollar_rl:{ icon: '💵', name: 'دلار آمریکا',      div: 10, unit: 'تومان' },
  price_eur:      { icon: '💶', name: 'یورو',             div: 10, unit: 'تومان' },
  ons:            { icon: '🌐', name: 'انس طلا',          div: 1,  unit: 'دلار'  }
};

/* ────────────────────────── storage ────────────────────────── */
function readJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    var v = JSON.parse(raw);
    return (v === null || v === undefined) ? fallback : v;
  } catch (e) { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}
function readLS(key, fallback) {
  try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, val); } catch (e) {}
}

/* ────────────────────────── numbers ────────────────────────── */
var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toFa(s) {
  return String(s).replace(/[0-9]/g, function (c) { return FA_DIGITS.charAt(+c); });
}
function toEn(s) {
  return String(s).replace(/[۰-۹]/g, function (c) {
    var i = FA_DIGITS.indexOf(c);
    return i < 0 ? c : String(i);
  });
}
function fmt(n) {
  n = Math.round(Number(n) || 0);
  var neg = n < 0;
  var s = Math.abs(n).toLocaleString('en-US').replace(/,/g, '٬');
  return toFa((neg ? '−' : '') + s);
}
function digitsOnly(s) {
  return toEn(s == null ? '' : String(s)).replace(/[^\d]/g, '');
}
function fmtShort(n) {
  var num = Math.round(Number(n) || 0);
  var sign = num < 0 ? '−' : '';
  num = Math.abs(num);
  if (num < 1000) return sign + fmt(num) + ' تومان';
  var units = [[1e12, 'همت'], [1e9, 'میلیارد'], [1e6, 'میلیون'], [1e3, 'هزار']];
  for (var i = 0; i < units.length; i++) {
    if (num >= units[i][0]) {
      var v = Math.floor(num / units[i][0] * 10) / 10;
      var s = (v % 1 === 0) ? toFa(v.toFixed(0)) : toFa(v.toFixed(1).replace('.', '٫'));
      return sign + s + ' ' + units[i][1] + ' تومان';
    }
  }
  return sign + fmt(num) + ' تومان';
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function uid() {
  return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function iconFor(desc) {
  var s = String(desc || '');
  for (var i = 0; i < ICON_RULES.length; i++) {
    var words = ICON_RULES[i][0];
    for (var k = 0; k < words.length; k++) {
      if (s.indexOf(words[k]) >= 0) return ICON_RULES[i][1];
    }
  }
  return '📝';
}

/* ────────────────────────── jalali calendar ────────────────────────── */
function g2j(gy, gm, gd) {
  var g = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var y2 = gm > 2 ? gy + 1 : gy;
  var d = 355666 + 365 * gy + Math.floor((y2 + 3) / 4) - Math.floor((y2 + 99) / 100) +
          Math.floor((y2 + 399) / 400) + gd + g[gm - 1];
  var jy = -1595 + 33 * Math.floor(d / 12053);
  d %= 12053;
  jy += 4 * Math.floor(d / 1461);
  d %= 1461;
  if (d > 365) { jy += Math.floor((d - 1) / 365); d = (d - 1) % 365; }
  if (d < 186) return [jy, 1 + Math.floor(d / 31), 1 + d % 31];
  return [jy, 7 + Math.floor((d - 186) / 30), 1 + (d - 186) % 30];
}
function gregToJDN(gy, gm, gd) {
  var a = Math.floor((14 - gm) / 12);
  var y = gy + 4800 - a;
  var m = gm + 12 * a - 3;
  return gd + Math.floor((153 * m + 2) / 5) + 365 * y +
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
var NEW_YEAR_CACHE = {};
function newYearJDN(jy) {
  if (NEW_YEAR_CACHE[jy]) return NEW_YEAR_CACHE[jy];
  var gy = jy + 621, found = 0;
  for (var d = 19; d <= 23; d++) {
    var j = g2j(gy, 3, d);
    if (j[0] === jy && j[1] === 1 && j[2] === 1) { found = gregToJDN(gy, 3, d); break; }
  }
  if (!found) found = gregToJDN(gy, 3, 21);
  NEW_YEAR_CACHE[jy] = found;
  return found;
}
function jalYearLen(jy) { return newYearJDN(jy + 1) - newYearJDN(jy); }
function jalDaysInMonth(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalYearLen(jy) - 336;
}
function jalMonthStartJDN(jy, jm) {
  var ny = newYearJDN(jy);
  return jm <= 7 ? ny + (jm - 1) * 31 : ny + 186 + (jm - 7) * 30;
}
/* شنبه = ۰ */
function satIndex(jdn) { return ((jdn + 1) % 7 + 1) % 7; }
function weekdayOf(jy, jm, jd) {
  return WEEKDAYS[satIndex(jalMonthStartJDN(jy, jm) + jd - 1)];
}
function nowJ() {
  var s, p, d, t;
  try {
    s = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tehran' });
    p = s.split(' ');
    d = p[0].split('-');
    t = (p[1] || '00:00:00').split(':');
    var j = g2j(+d[0], +d[1], +d[2]);
    return { y: j[0], m: j[1], d: j[2], time: pad2(+t[0] || 0) + ':' + pad2(+t[1] || 0) };
  } catch (e) {
    var n = new Date();
    var jj = g2j(n.getFullYear(), n.getMonth() + 1, n.getDate());
    return { y: jj[0], m: jj[1], d: jj[2], time: pad2(n.getHours()) + ':' + pad2(n.getMinutes()) };
  }
}
function dateString(y, m, d, time) {
  return y + '/' + pad2(m) + '/' + pad2(d) + ' ' + MONTHS[m] + ' ' + (time || '00:00');
}
function prettyDate(y, m, d) {
  return toFa(d) + ' ' + MONTHS[m] + ' ' + toFa(y);
}
function validDate(y, m, d) {
  y = Number(y); m = Number(m); d = Number(d);
  if (!y || !m || !d) return false;
  if (m < 1 || m > 12) return false;
  return d >= 1 && d <= jalDaysInMonth(y, m);
}

/* ────────────────────────── data ────────────────────────── */
function normEntry(raw) {
  var e = (raw && typeof raw === 'object') ? raw : {};
  var out = {
    id:      e.id ? String(e.id) : uid(),
    type:    e.type === 'income' ? 'income' : 'expense',
    amount:  Math.abs(Math.round(Number(e.amount) || 0)),
    desc:    (e.desc == null ? '' : String(e.desc)).trim() || 'بدون توضیح',
    card:    e.card == null ? '' : String(e.card),
    who:     e.who === 'family' ? 'family' : 'me',
    year:    Number(e.year) || 0,
    month:   Number(e.month) || 0,
    day:     Number(e.day) || 0,
    time:    e.time ? String(e.time) : '00:00',
    date:    e.date ? String(e.date) : ''
  };
  if (!out.year || !out.month || !out.day) {
    var m = String(e.date || '').match(/(\d{4})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})/);
    if (m) { out.year = +m[1]; out.month = +m[2]; out.day = +m[3]; }
  }
  if (!out.date && out.year) out.date = dateString(out.year, out.month, out.day, out.time);
  return out;
}
function normDebt(raw) {
  var d = (raw && typeof raw === 'object') ? raw : {};
  return {
    id:     d.id ? String(d.id) : uid(),
    name:   (d.name == null ? '' : String(d.name)).trim() || 'بدون نام',
    amount: Math.abs(Math.round(Number(d.amount) || 0)),
    desc:   (d.desc == null ? '' : String(d.desc)).trim() || '—',
    type:   d.type === 'debtor' ? 'debtor' : 'creditor',
    date:   d.date ? String(d.date) : '',
    paid:   !!d.paid
  };
}
function normAccounts(raw) {
  var list = Array.isArray(raw) ? raw : null;
  if (!list || !list.length) return JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var a = list[i];
    if (!a || typeof a !== 'object') continue;
    var color = String(a.color || '');
    if (OLD_COLORS[color]) color = OLD_COLORS[color];
    if (COLOR_ORDER.indexOf(color) < 0) color = COLOR_ORDER[i % COLOR_ORDER.length];
    out.push({
      id:    a.id ? String(a.id) : 'a' + i + uid(),
      name:  (a.name == null ? '' : String(a.name)).trim() || 'حساب ' + (i + 1),
      icon:  a.icon ? String(a.icon) : '💳',
      color: color
    });
  }
  return out.length ? out : JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
}

var rawEntries = readJSON(SK.entries, []);
var rawDebts   = readJSON(SK.debts, []);
var rawBal     = readJSON(SK.bal, {});

var entries  = (Array.isArray(rawEntries) ? rawEntries : []).map(normEntry);
var debts    = (Array.isArray(rawDebts) ? rawDebts : []).map(normDebt);
var accounts = normAccounts(readJSON(SK.accs, null));
var balances = (rawBal && typeof rawBal === 'object' && !Array.isArray(rawBal)) ? rawBal : {};
var budget   = Math.abs(Number(readJSON(SK.budget, 0))) || 0;

accounts.forEach(function (a) {
  if (typeof balances[a.id] !== 'number') {
    var v = Number(balances[a.id]);
    balances[a.id] = isNaN(v) ? 0 : v;
  }
});

/* ────────────────────────── state ────────────────────────── */
var state = {
  page: 'home',
  filter: 'all',
  month: null,
  search: '',
  limit: 12,
  debtType: 'creditor',
  calY: 0,
  calM: 0,
  calDay: 0,
  hidden: readLS('dakhel_balvis', 'show') === 'hide',
  theme: readLS(SK.theme, 'system'),
  entryMode: 'add',
  editId: '',
  amountRaw: '',
  entryType: 'expense',
  entryAcc: '',
  entryWho: 'me',
  entryDate: null,
  debtEditId: '',
  balAcc: '',
  balNeg: false,
  dpY: 0,
  dpM: 0
};

var last = readJSON(SK.last, {});
if (!last || typeof last !== 'object') last = {};
if (last.acc) state.entryAcc = String(last.acc);
if (last.who === 'family') state.entryWho = 'family';
if (last.type === 'income') state.entryType = 'income';

/* ────────────────────────── tiny dom helpers ────────────────────────── */
function $(id) { return document.getElementById(id); }
function setHTML(id, html) { var e = $(id); if (e) e.innerHTML = html; }
function setText(id, txt) { var e = $(id); if (e) e.textContent = txt; }
function show(el) { if (typeof el === 'string') el = $(el); if (el) el.hidden = false; }
function hide(el) { if (typeof el === 'string') el = $(el); if (el) el.hidden = true; }
function openBox(id) { var e = $(id); if (e) e.classList.add('is-open'); }
function closeBox(id) { var e = $(id); if (e) e.classList.remove('is-open'); }

var toastTimer = null;
function toast(msg) {
  var t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2100);
}
function buzz(ms) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
}
function emptyHTML(icon, text) {
  return '<div class="empty"><div class="empty-ico">' + icon + '</div><p>' + text + '</p></div>';
}

/* ══════════════════════ persistence ══════════════════════ */
function persistEntries() { writeJSON(SK.entries, entries); }
function persistDebts()   { writeJSON(SK.debts, debts); }
function persistBalances(){ writeJSON(SK.bal, balances); }
function persistAccounts(){ writeJSON(SK.accs, accounts); }
function persistAll() {
  persistEntries(); persistDebts(); persistBalances(); persistAccounts();
  writeJSON(SK.budget, budget);
}
function rememberLast() {
  writeJSON(SK.last, { acc: state.entryAcc, who: state.entryWho, type: state.entryType });
}

/* ══════════════════════ lookups ══════════════════════ */
function accByName(name) {
  for (var i = 0; i < accounts.length; i++) if (accounts[i].name === name) return accounts[i];
  return null;
}
function accById(id) {
  for (var i = 0; i < accounts.length; i++) if (accounts[i].id === id) return accounts[i];
  return null;
}
function entryById(id) {
  for (var i = 0; i < entries.length; i++) if (entries[i].id === id) return entries[i];
  return null;
}
function debtById(id) {
  for (var i = 0; i < debts.length; i++) if (debts[i].id === id) return debts[i];
  return null;
}
function accClass(name) {
  var a = accByName(name);
  return a ? 'c-' + a.color : 'c-slate';
}
function accClassById(id) {
  var a = accById(id);
  return a ? 'c-' + a.color : 'c-slate';
}

/* موجودی حساب را با یک تراکنش هم‌سو می‌کند؛ sign=+1 ثبت، sign=-1 برگشت */
function applyBalance(cardName, type, amount, sign) {
  var a = accByName(cardName);
  if (!a) return;
  var delta = (type === 'expense' ? -amount : amount) * sign;
  balances[a.id] = (Number(balances[a.id]) || 0) + delta;
  persistBalances();
}

/* ══════════════════════ pages ══════════════════════ */
var PAGE_TITLES = {
  home: 'حسابداری', tx: 'تراکنش‌ها', debts: 'بدهی‌ها', cal: 'تقویم', rates: 'طلا و ارز'
};

function switchPage(page) {
  state.page = page;
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.toggle('is-active', pages[i].id === 'page-' + page);
  }
  var tabs = document.querySelectorAll('.tab');
  for (var k = 0; k < tabs.length; k++) {
    tabs[k].classList.toggle('is-on', tabs[k].dataset.page === page);
  }
  setText('pageTitle', PAGE_TITLES[page] || 'حسابداری');
  try { window.scrollTo(0, 0); } catch (e) {}

  if (page === 'home') renderHome();
  if (page === 'tx') renderTx();
  if (page === 'debts') renderDebts();
  if (page === 'cal') renderCal();
  if (page === 'rates') renderRatesPage();
}

function renderAll() {
  renderHome();
  if (state.page === 'tx') renderTx();
  if (state.page === 'debts') renderDebts();
  if (state.page === 'cal') renderCal();
}

/* ══════════════════════ theme ══════════════════════ */
function systemPrefersLight() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches); }
  catch (e) { return false; }
}
function applyTheme(mode) {
  if (mode !== 'dark' && mode !== 'light') mode = 'system';
  state.theme = mode;
  writeLS(SK.theme, mode);
  var dark = mode === 'dark' || (mode === 'system' && !systemPrefersLight());
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  setText('btnTheme', dark ? '🌙' : '☀️');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#08090f' : '#f3f4f9');
  var seg = document.querySelectorAll('#themeSeg .seg-btn');
  for (var i = 0; i < seg.length; i++) {
    seg[i].classList.toggle('is-on', seg[i].dataset.v === mode);
  }
}
function cycleTheme() {
  var order = ['dark', 'light', 'system'];
  var next = order[(order.indexOf(state.theme) + 1) % 3];
  applyTheme(next);
  toast(next === 'dark' ? 'تم تیره' : next === 'light' ? 'تم روشن' : 'تم سیستم');
  buzz(8);
}

/* ══════════════════════ home ══════════════════════ */
function monthTotals(y, m) {
  var exp = 0, inc = 0, cnt = 0;
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.year === y && e.month === m) {
      cnt++;
      if (e.type === 'expense') exp += e.amount; else inc += e.amount;
    }
  }
  return { exp: exp, inc: inc, cnt: cnt };
}

function renderHome() {
  var j = nowJ();
  var t = monthTotals(j.y, j.m);
  var total = 0;
  for (var i = 0; i < accounts.length; i++) total += Number(balances[accounts[i].id]) || 0;

  var balEl = $('totalBal');
  if (balEl) {
    balEl.innerHTML = state.hidden
      ? '••••• <small>تومان</small>'
      : fmt(total) + ' <small>تومان</small>';
  }
  setText('totalShort', state.hidden ? '' : fmtShort(total));
  setText('eyeBtn', state.hidden ? 'نمایش' : 'پنهان');

  var mask = '••••';
  setText('statInc', state.hidden ? mask : fmt(t.inc));
  setText('statExp', state.hidden ? mask : fmt(t.exp));
  var net = t.inc - t.exp;
  var netEl = $('statNet');
  if (netEl) {
    netEl.textContent = state.hidden
      ? mask
      : (net < 0 ? '−' : '') + fmt(Math.abs(net));
    netEl.className = state.hidden ? '' : (net > 0 ? 'pos' : (net < 0 ? 'neg' : ''));
  }

  var box = $('budgetBox');
  if (box) {
    if (budget > 0 && !state.hidden) {
      box.hidden = false;
      var pct = Math.min(100, Math.round(t.exp / budget * 100));
      var bar = $('budgetBar');
      if (bar) {
        bar.style.width = pct + '%';
        bar.className = pct >= 100 ? 'warn' : '';
      }
      setText('budgetText', fmt(t.exp) + ' از ' + fmt(budget) + ' · ' + toFa(pct) + '٪');
    } else {
      box.hidden = true;
    }
  }

  renderAccounts();
  renderTrend();
  renderTop();
  renderFam();
  renderCompare(j);
  renderCats(j);
  renderRecent();
}

/* ── مقایسه با ماه قبل ── */
function prevMonth(y, m) {
  return m === 1 ? { y: y - 1, m: 12 } : { y: y, m: m - 1 };
}

function renderCompare(j) {
  var box = $('heroCmp');
  if (!box) return;
  if (state.hidden) { box.innerHTML = ''; return; }

  var p = prevMonth(j.y, j.m);
  var cur = monthTotals(j.y, j.m);
  var old = monthTotals(p.y, p.m);

  var curNet = cur.inc - cur.exp;
  var oldNet = old.inc - old.exp;

  var chip = '';
  if (old.exp > 0) {
    var diff = Math.round((cur.exp - old.exp) / old.exp * 100);
    var cls = diff > 0 ? 'down' : (diff < 0 ? 'up' : '');
    var arrow = diff > 0 ? '▲' : (diff < 0 ? '▼' : '•');
    var word = diff > 0 ? 'بیشتر' : (diff < 0 ? 'کمتر' : 'مثل قبل');
    chip = '<span class="cmp-chip ' + cls + '">' + arrow + ' ' +
           toFa(Math.abs(diff)) + '٪ ' + word + ' از ' + MONTHS[p.m] + '</span>';
  }

  var hint;
  if (!old.inc && !old.exp) {
    hint = 'ماه قبل تراکنشی نداشتی';
  } else {
    var d = curNet - oldNet;
    if (d === 0) hint = 'مانده ماه مثل ' + MONTHS[p.m] + ' است';
    else if (d > 0) hint = fmtShort(d) + ' بهتر از ' + MONTHS[p.m];
    else hint = fmtShort(-d) + ' کمتر خرج کردی از ' + MONTHS[p.m];
  }

  box.innerHTML = chip + '<span class="cmp-hint">' + esc(hint) + '</span>';
}

/* ── دسته‌بندی خرج ماه ── */
/* index = نخستین ردیف ICON_RULES که کلیدواژه‌اش در توضیح آمده */
function catOf(desc) {
  var s = String(desc || '');
  for (var i = 0; i < ICON_RULES.length; i++) {
    var words = ICON_RULES[i][0];
    for (var k = 0; k < words.length; k++) {
      if (s.indexOf(words[k]) >= 0) return i;
    }
  }
  return -1;
}

function renderCats(j) {
  var box = $('catBox');
  if (!box) return;
  if (state.hidden) { box.hidden = true; return; }

  var by = {}, order = [], total = 0;
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.type !== 'expense' || e.year !== j.y || e.month !== j.m) continue;
    var c = catOf(e.desc);
    if (!by[c]) { by[c] = 0; order.push(c); }
    by[c] += e.amount;
    total += e.amount;
  }
  if (!order.length) { box.hidden = true; return; }

  order.sort(function (a, b) { return by[b] - by[a]; });
  var h = '';
  order.slice(0, 5).forEach(function (k, idx) {
    var icon = k >= 0 ? ICON_RULES[k][1] : '📝';
    var name = k >= 0 ? (CATS[k] || 'سایر') : 'سایر';
    var pct = total ? Math.round(by[k] / total * 100) : 0;
    h += '<div class="cat-item">' +
           '<div class="cat-head">' +
             '<span class="cat-ico">' + icon + '</span>' +
             '<span class="cat-name">' + esc(name) + '</span>' +
             '<span class="cat-pct">' + toFa(pct) + '٪</span>' +
             '<span class="cat-val">' + fmt(by[k]) + '</span>' +
           '</div>' +
           '<div class="cat-bar"><i style="width:' + pct + '%;transition-delay:' +
             (idx * 0.05) + 's"></i></div>' +
         '</div>';
  });
  setHTML('catList', h);
  setText('catSub', 'جمع ' + fmtShort(total));
  box.hidden = false;
}

/* ── آخرین تراکنش‌ها ── */
function renderRecent() {
  var box = $('recentBox');
  if (!box) return;
  if (state.hidden) { box.hidden = true; return; }
  var list = sortEntries(entries).slice(0, 4);
  if (!list.length) { box.hidden = true; return; }

  var h = '';
  list.forEach(function (e) {
    var isExp = e.type === 'expense';
    h += '<div class="recent-row" data-act="tx" data-id="' + esc(e.id) + '">' +
           '<span class="recent-ico">' + iconFor(e.desc) + '</span>' +
           '<span class="recent-nm">' + esc(e.desc) + '</span>' +
           '<span class="recent-dt">' + toFa(e.day) + ' ' + MONTHS_SHORT[e.month] + '</span>' +
           '<span class="recent-vl ' + (isExp ? 'exp' : 'inc') + '">' +
             (state.hidden ? '•••' : (isExp ? '−' : '+') + ' ' + fmt(e.amount)) +
           '</span>' +
         '</div>';
  });
  setHTML('recentList', h);
  box.hidden = false;
}

function renderAccounts() {
  var row = $('accRow');
  if (!row) return;
  if (!accounts.length) { row.innerHTML = emptyHTML('🏦', 'حسابی تعریف نشده'); return; }
  var h = '';
  for (var i = 0; i < accounts.length; i++) {
    var a = accounts[i];
    var bal = Number(balances[a.id]) || 0;
    h += '<button class="acc-card c-' + a.color + '" data-act="bal" data-id="' + esc(a.id) + '">' +
           '<span class="acc-top"><span class="acc-dot"></span>' +
             '<span class="acc-name">' + esc(a.name) + '</span></span>' +
           '<span class="acc-bal">' + (state.hidden ? '••••' : fmt(bal)) + '</span>' +
           '<span class="acc-unit">تومان</span>' +
         '</button>';
  }
  row.innerHTML = h;
}

function renderTrend() {
  var j = nowJ();
  var months = [], y = j.y, m = j.m;
  for (var i = 5; i >= 0; i--) {
    var mm = m - i, yy = y;
    while (mm < 1) { mm += 12; yy--; }
    months.push({ y: yy, m: mm, exp: 0, inc: 0 });
  }
  for (var k = 0; k < entries.length; k++) {
    var e = entries[k];
    for (var n = 0; n < months.length; n++) {
      if (e.year === months[n].y && e.month === months[n].m) {
        if (e.type === 'expense') months[n].exp += e.amount; else months[n].inc += e.amount;
        break;
      }
    }
  }
  var max = 0;
  months.forEach(function (o) { if (o.exp > max) max = o.exp; if (o.inc > max) max = o.inc; });

  var h = '';
  months.forEach(function (o) {
    var eh = max ? Math.max(3, Math.round(o.exp * 92 / max)) : 3;
    var ih = max ? Math.max(3, Math.round(o.inc * 92 / max)) : 3;
    h += '<div class="tcol">' +
           '<div class="tbars">' +
             '<i class="tbar inc" style="height:' + ih + 'px"></i>' +
             '<i class="tbar exp" style="height:' + eh + 'px"></i>' +
           '</div>' +
           '<span class="tlabel">' + MONTHS_SHORT[o.m] + '</span>' +
         '</div>';
  });
  setHTML('trendChart', h);
  setText('trendSub', max ? 'دخل / خرج' : 'داده‌ای نیست');
}

function renderTop() {
  var j = nowJ();
  var box = $('topBox');
  if (!box) return;
  var by = {}, order = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.type !== 'expense' || e.year !== j.y || e.month !== j.m) continue;
    if (!by[e.desc]) { by[e.desc] = { sum: 0, n: 0 }; order.push(e.desc); }
    by[e.desc].sum += e.amount;
    by[e.desc].n++;
  }
  if (!order.length) { box.hidden = true; return; }
  order.sort(function (a, b) { return by[b].sum - by[a].sum; });
  var top = order.slice(0, 5);
  var shown = 0;
  for (var k = 0; k < top.length; k++) shown += by[top[k]].sum;

  var h = '';
  top.forEach(function (name, idx) {
    var pct = shown ? Math.round(by[name].sum / shown * 100) : 0;
    h += '<div class="top-item">' +
           '<div class="top-line">' +
             '<span class="top-ico">' + iconFor(name) + '</span>' +
             '<span class="top-name">' + esc(name) +
               (by[name].n > 1 ? ' <span style="color:var(--text-3);font-weight:600">×' + toFa(by[name].n) + '</span>' : '') +
             '</span>' +
             '<span class="top-val">' + fmt(by[name].sum) + '</span>' +
           '</div>' +
           '<div class="top-bar"><i style="width:' + pct + '%;animation:rise .5s ' + (idx * 0.06) + 's both"></i></div>' +
         '</div>';
  });
  setHTML('topList', h);
  setText('topSub', MONTHS[j.m] + ' · ' + fmtShort(shown));
  box.hidden = false;
}

function famTally() {
  var inc = 0, exp = 0, cnt = 0;
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.who !== 'family') continue;
    cnt++;
    if (e.type === 'expense') exp += e.amount; else inc += e.amount;
  }
  return { inc: inc, exp: exp, net: inc - exp, cnt: cnt };
}

function renderFam() {
  var box = $('famBox');
  if (!box) return;
  var t = famTally();
  if (!t.cnt) { box.hidden = true; return; }
  box.hidden = false;
  setText('famIn', fmt(t.inc));
  setText('famOut', fmt(t.exp));
  var netEl = $('famNet');
  if (netEl) {
    netEl.textContent = (t.net < 0 ? '−' : '') + fmt(Math.abs(t.net));
    netEl.style.color = t.net > 0 ? 'var(--mint)' : (t.net < 0 ? 'var(--rose)' : 'var(--text)');
  }
  setText('famNote', 'از ' + toFa(t.cnt) + ' تراکنش');
}

/* ══════════════════════ transactions ══════════════════════ */
function sortEntries(list) {
  return list.slice().sort(function (a, b) {
    if (b.year !== a.year) return b.year - a.year;
    if (b.month !== a.month) return b.month - a.month;
    if (b.day !== a.day) return b.day - a.day;
    return String(b.time || '').localeCompare(String(a.time || ''));
  });
}

function filteredEntries() {
  var list = entries.slice();
  if (state.filter === 'expense' || state.filter === 'income') {
    list = list.filter(function (e) { return e.type === state.filter; });
  } else if (state.filter === 'fam') {
    list = list.filter(function (e) { return e.who === 'family'; });
  }
  if (state.month) {
    var my = state.month.y, mm = state.month.m;
    list = list.filter(function (e) { return e.year === my && e.month === mm; });
  }
  var q = String(state.search || '').trim().toLowerCase();
  if (q) {
    list = list.filter(function (e) {
      var d = String(e.desc || '').toLowerCase();
      var c = String(e.card || '').toLowerCase();
      return d.indexOf(q) >= 0 || c.indexOf(q) >= 0;
    });
  }
  return sortEntries(list);
}

function txItemHTML(e) {
  var isExp = e.type === 'expense';
  return '<div class="tx-item ' + (isExp ? 'exp' : 'inc') + '" data-act="tx" data-id="' + esc(e.id) + '">' +
           '<div class="tx-ico ' + (isExp ? 'exp' : 'inc') + '">' + iconFor(e.desc) + '</div>' +
           '<div class="tx-body">' +
             '<div class="tx-title">' + esc(e.desc) + '</div>' +
             '<div class="tx-meta">' +
               (e.card ? '<span class="chip ' + accClass(e.card) + '">' + esc(e.card) + '</span>' : '') +
               (e.who === 'family' ? '<span class="chip c-violet">خانواده</span>' : '') +
               '<span>' + esc(e.time || '') + '</span>' +
             '</div>' +
           '</div>' +
           '<div class="tx-amt"><b>' + (isExp ? '−' : '+') + ' ' + fmt(e.amount) + '</b><span>تومان</span></div>' +
         '</div>';
}

function renderTx() {
  var list = filteredEntries();

  var expSum = 0, incSum = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].type === 'expense') expSum += list[i].amount; else incSum += list[i].amount;
  }
  setHTML('txSummary',
    '<div class="ts"><small>تراکنش</small><b>' + fmt(list.length) + '</b></div>' +
    '<div class="ts b-exp"><small>خرج</small><b>' + fmt(expSum) + '</b></div>' +
    '<div class="ts b-inc"><small>دخل</small><b>' + fmt(incSum) + '</b></div>');

  var box = $('txList');
  if (!box) return;
  if (!list.length) {
    box.innerHTML = entries.length
      ? emptyHTML('🔍', 'با این فیلتر چیزی پیدا نشد')
      : emptyHTML('🧾', 'هنوز تراکنشی ثبت نشده<br>دکمه + پایین صفحه را بزن');
    hide('btnMore');
    return;
  }

  /* جمع هر روز برای سرتیتر گروه */
  var daySum = {};
  for (var d = 0; d < list.length; d++) {
    var key = list[d].year + '/' + list[d].month + '/' + list[d].day;
    if (!daySum[key]) daySum[key] = 0;
    daySum[key] += (list[d].type === 'expense' ? -list[d].amount : list[d].amount);
  }

  var shown = Math.min(list.length, state.limit);
  var h = '', lastKey = '';
  for (var n = 0; n < shown; n++) {
    var e = list[n];
    var k2 = e.year + '/' + e.month + '/' + e.day;
    if (k2 !== lastKey) {
      lastKey = k2;
      var net = daySum[k2] || 0;
      h += '<div class="day-head">' +
             '<span>' + weekdayOf(e.year, e.month, e.day) + ' ' + toFa(e.day) + ' ' + MONTHS[e.month] + '</span>' +
             '<b style="color:' + (net > 0 ? 'var(--mint)' : net < 0 ? 'var(--rose)' : 'var(--text-3)') + '">' +
               (net > 0 ? '+' : net < 0 ? '−' : '') + fmt(Math.abs(net)) +
             '</b>' +
           '</div>';
    }
    h += txItemHTML(e);
  }
  box.innerHTML = h;

  var more = $('btnMore');
  if (more) {
    var rest = list.length - shown;
    if (rest > 0) {
      more.hidden = false;
      more.textContent = 'نمایش بیشتر (' + toFa(rest) + ' تراکنش)';
    } else {
      more.hidden = true;
    }
  }
}

/* ══════════════════════ month filter menu ══════════════════════ */
function buildMonthMenu() {
  var seen = {}, arr = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (!e.year || !e.month) continue;
    var key = e.year + '/' + e.month;
    if (!seen[key]) { seen[key] = 1; arr.push({ y: e.year, m: e.month }); }
  }
  arr.sort(function (a, b) { return (b.y * 100 + b.m) - (a.y * 100 + a.m); });

  var h = '<button data-act="month" data-k="all"' + (state.month ? '' : ' class="is-on"') + '>همه ماه‌ها</button>';
  arr.forEach(function (o) {
    var on = state.month && state.month.y === o.y && state.month.m === o.m;
    h += '<button data-act="month" data-k="' + o.y + '/' + o.m + '"' + (on ? ' class="is-on"' : '') + '>' +
         MONTHS[o.m] + ' ' + toFa(o.y) + '</button>';
  });
  setHTML('monthMenu', h);
}
function updateMonthLabel() {
  setText('monthBtnText', state.month ? MONTHS[state.month.m] + ' ' + toFa(state.month.y) : 'همه ماه‌ها');
}
function toggleMonthMenu(force) {
  var menu = $('monthMenu');
  if (!menu) return;
  var open = (typeof force === 'boolean') ? force : !menu.classList.contains('is-open');
  if (open) { buildMonthMenu(); menu.classList.add('is-open'); }
  else menu.classList.remove('is-open');
}

/* ══════════════════════ debts ══════════════════════ */
function renderDebts() {
  var isC = state.debtType === 'creditor';
  var list = debts.filter(function (d) { return d.type === state.debtType; });
  var open = list.filter(function (d) { return !d.paid; });
  var sum = 0;
  open.forEach(function (d) { sum += d.amount; });

  setText('debtSumLabel', isC ? 'جمع طلب‌کاری' : 'جمع بدهی');
  var sumCard = document.querySelector('#page-debts .debt-sum');
  if (sumCard) sumCard.className = 'card debt-sum ' + (isC ? 'cred' : 'deb');
  var amtEl = $('debtSumAmt');
  if (amtEl) {
    amtEl.textContent = fmt(sum) + ' تومان';
    amtEl.style.color = isC ? 'var(--mint)' : 'var(--rose)';
  }
  var meta = open.length
    ? toFa(open.length) + ' مورد تسویه‌نشده از ' + toFa(list.length)
    : (list.length ? 'همه تسویه شده ✓' : '');
  setText('debtSumMeta', meta);

  var box = $('debtList');
  if (!box) return;
  if (!list.length) {
    box.innerHTML = emptyHTML(isC ? '💚' : '❤️',
      isC ? 'کسی از تو طلب ندارد' : 'بدهی ثبت نشده');
    return;
  }

  var sorted = list.slice().sort(function (a, b) {
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    return b.amount - a.amount;
  });

  var h = '';
  sorted.forEach(function (d) {
    h += '<div class="debt-card ' + (isC ? 'cred' : 'deb') + (d.paid ? ' is-paid' : '') + '" data-act="debt" data-id="' + esc(d.id) + '">' +
           '<div class="debt-av">' + esc(String(d.name).charAt(0)) + '</div>' +
           '<div class="debt-body">' +
             '<div class="debt-name">' + esc(d.name) + (d.paid ? ' <span style="color:var(--mint)">✓</span>' : '') + '</div>' +
             '<div class="debt-meta">' + esc(d.desc) + (d.date ? ' · ' + esc(String(d.date).split(' ')[0]) : '') + '</div>' +
           '</div>' +
           '<div class="debt-amt"><b>' + fmt(d.amount) + '</b><span>تومان</span></div>' +
           '<button class="paid' + (d.paid ? ' is-on' : '') + '" data-act="paid" data-id="' + esc(d.id) + '" aria-label="تسویه">✓</button>' +
         '</div>';
  });
  box.innerHTML = h;
}



/* ══════════════════════ calendar ══════════════════════ */
function calMove(dir) {
  state.calM += dir;
  if (state.calM > 12) { state.calM = 1; state.calY++; }
  if (state.calM < 1) { state.calM = 12; state.calY--; }
  state.calDay = 0;
  renderCal();
  buzz(6);
}

function renderCal() {
  var j = nowJ();
  if (!state.calY) { state.calY = j.y; state.calM = j.m; }
  setText('calTitle', MONTHS[state.calM] + ' ' + toFa(state.calY));

  var wd = '';
  for (var i = 0; i < 7; i++) wd += '<div>' + WEEKDAY_INITIALS[i] + '</div>';
  setHTML('calWeekdays', wd);

  var days = jalDaysInMonth(state.calY, state.calM);
  var lead = satIndex(jalMonthStartJDN(state.calY, state.calM));

  var map = {}, maxExp = 0, mExp = 0, mInc = 0;
  for (var k = 0; k < entries.length; k++) {
    var e = entries[k];
    if (e.year !== state.calY || e.month !== state.calM) continue;
    var st = map[e.day];
    if (!st) { st = { exp: 0, inc: 0, n: 0 }; map[e.day] = st; }
    if (e.type === 'expense') { st.exp += e.amount; mExp += e.amount; }
    else { st.inc += e.amount; mInc += e.amount; }
    st.n++;
  }
  for (var dk in map) { if (map[dk].exp > maxExp) maxExp = map[dk].exp; }

  var h = '';
  for (var p = 0; p < lead; p++) h += '<div class="cal-cell blank"></div>';
  for (var d = 1; d <= days; d++) {
    var ds = map[d];
    var cls = 'cal-cell';
    if (ds && ds.exp > 0 && maxExp > 0) {
      cls += ' h' + Math.max(1, Math.min(4, Math.ceil(ds.exp / maxExp * 4)));
    }
    if (ds && ds.inc > 0) cls += ' has-inc';
    if (state.calY === j.y && state.calM === j.m && d === j.d) cls += ' today';
    if (state.calDay === d) cls += ' sel';
    h += '<button class="' + cls + '" data-act="calday" data-d="' + d + '">' +
           '<span class="cal-num">' + toFa(d) + '</span>' +
           (ds && ds.inc > 0 ? '<span class="cal-dot"></span>' : '') +
         '</button>';
  }
  setHTML('calGrid', h);
  setHTML('calMonthSum',
    '<div class="ts b-exp"><small>خرج ماه</small><b>' + fmt(mExp) + '</b></div>' +
    '<div class="ts b-inc"><small>دخل ماه</small><b>' + fmt(mInc) + '</b></div>');
  renderCalDay();
}

function renderCalDay() {
  var box = $('calDay');
  if (!box) return;
  if (!state.calDay) { box.hidden = true; box.innerHTML = ''; return; }

  var list = entries.filter(function (e) {
    return e.year === state.calY && e.month === state.calM && e.day === state.calDay;
  });
  var totExp = 0, totInc = 0;
  list.forEach(function (e) {
    if (e.type === 'expense') totExp += e.amount; else totInc += e.amount;
  });

  var parts = [];
  if (totExp) parts.push('خرج ' + fmt(totExp));
  if (totInc) parts.push('دخل ' + fmt(totInc));

  var h = '<div class="card-head"><span>' +
          weekdayOf(state.calY, state.calM, state.calDay) + ' ' +
          toFa(state.calDay) + ' ' + MONTHS[state.calM] + '</span>' +
          '<span class="muted">' + (parts.length ? parts.join(' · ') : 'بدون تراکنش') + '</span></div>';

  if (!list.length) {
    box.innerHTML = h + emptyHTML('🗓️', 'این روز تراکنشی ندارد');
    box.hidden = false;
    return;
  }

  list.sort(function (a, b) { return String(a.time || '').localeCompare(String(b.time || '')); });
  list.forEach(function (e) {
    var isExp = e.type === 'expense';
    h += '<div class="cal-day-row">' +
           '<span class="ico">' + iconFor(e.desc) + '</span>' +
           '<span class="nm">' + esc(e.desc) + '</span>' +
           '<span class="vl ' + (isExp ? 'exp' : 'inc') + '">' +
             (isExp ? '−' : '+') + ' ' + fmt(e.amount) +
           '</span>' +
         '</div>';
  });
  box.innerHTML = h;
  box.hidden = false;
}

/* ══════════════════════ gold & currency rates ══════════════════════ */
var ratesCache = readJSON(SK.rates, null);
var ratesLastFetch = 0;

function tgjuNum(v) {
  if (!v) return 0;
  return parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
}
function ratesItems(raw) {
  var out = [];
  for (var key in RATES_META) {
    if (!RATES_META.hasOwnProperty(key)) continue;
    var it = raw && raw[key];
    if (!it || it.p === undefined || it.p === null || isNaN(parseFloat(it.p))) continue;
    var meta = RATES_META[key];
    out.push({
      key: key,
      icon: meta.icon,
      name: meta.name,
      unit: meta.unit,
      value: Math.round(parseFloat(it.p) / meta.div),
      dp: (it.dp === undefined || it.dp === null || it.dp === '') ? null : parseFloat(it.dp)
    });
  }
  return out;
}
function renderRates(items, note) {
  var h = '';
  items.forEach(function (r) {
    var chg = '';
    if (r.dp !== null && !isNaN(r.dp)) {
      var up = r.dp >= 0;
      var abs = Math.abs(r.dp).toLocaleString('en-US', { maximumFractionDigits: 2 }).replace(/,/g, '٬');
      chg = '<div class="rate-chg ' + (up ? 'up' : 'down') + '">' +
            (up ? '▲' : '▼') + ' ' + toFa(abs) + '٪</div>';
    }
    h += '<div class="rate-item">' +
           '<div class="rate-ico">' + (r.icon || '💱') + '</div>' +
           '<div class="rate-body">' +
             '<div class="rate-name">' + esc(r.name || r.key) + '</div>' + chg +
           '</div>' +
           '<div class="rate-val">' + fmt(r.value) + '<small>' + esc(r.unit || 'تومان') + '</small></div>' +
         '</div>';
  });
  setHTML('ratesList', h || emptyHTML('📈', 'قیمتی دریافت نشد'));
  if (note !== undefined) setHTML('ratesMeta', note);
}
function ageMinutes(iso) {
  var s = String(iso || '').trim();
  if (!s) return 999;
  var t = Date.parse(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s) ? s : s.replace(' ', 'T') + 'Z');
  if (isNaN(t)) return 999;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}
function refreshRates() {
  var btn = $('btnRates');
  if (btn) {
    if (btn.dataset.busy) return;
    btn.dataset.busy = '1';
    btn.textContent = '⏳ دریافت…';
  }
  var finish = function () {
    if (btn) { btn.dataset.busy = ''; btn.textContent = '🔄 بروزرسانی'; }
  };
  ratesLastFetch = Date.now();

  fetch(RATES_URL + '?cb=' + Date.now(), { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    })
    .then(function (d) {
      var items = ratesItems(d && d.items);
      if (!items.length) throw new Error('empty');
      var t = String((d.items.geram18 && d.items.geram18.ts) || '').match(/(\d{2}:\d{2})/);
      var mins = ageMinutes(d.fetched);
      var note = '🟢 قیمت لحظه‌ای' + (t ? ' — ' + toFa(t[1]) + ' به‌وقت تهران' : '');
      if (mins > 45) note += ' · ⚠️ ' + toFa(mins) + ' دقیقه پیش';
      note += '<br>بروزرسانی خودکار هر ۱۰ دقیقه';
      ratesCache = { items: items, note: note, time: new Date().toISOString() };
      writeJSON(SK.rates, ratesCache);
      renderRates(items, note);
      finish();
    })
    .catch(function () {
      return fetchDailyRates().then(function (res) {
        ratesCache = { items: res.items, note: res.note, time: new Date().toISOString() };
        writeJSON(SK.rates, ratesCache);
        renderRates(res.items, res.note);
        finish();
      });
    })
    .catch(function () {
      finish();
      buzz(40);
      toast('دریافت قیمت‌ها ناموفق بود — اینترنت را چک کن');
    });
}
function fetchDailyRates() {
  var keys = ['geram18', 'price_dollar_rl', 'price_eur'];
  return Promise.all(keys.map(function (k) {
    return fetch('https://api.tgju.org/v1/market/indicator/summary-table-data/' + k, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var row = (d.data || [['0']])[0];
        var dpRaw = String(row[5] || '').replace(/<[^>]*>/g, '').trim();
        return { key: k, p: tgjuNum(row[0]), dp: dpRaw ? parseFloat(dpRaw) : null };
      });
  })).then(function (list) {
    var o = {};
    list.forEach(function (x) { o[x.key] = { p: x.p, dp: x.dp }; });
    return {
      items: ratesItems(o),
      note: '⚠️ قیمت لحظه‌ای در دسترس نیست — نمایش آخرین روز معاملاتی'
    };
  });
}
function autoRefreshRates() {
  if (Date.now() - ratesLastFetch > 90000) refreshRates();
}
function renderRatesPage() {
  if (ratesCache && ratesCache.items && ratesCache.items.length) {
    var note = ratesCache.note ||
      ('آخرین بروزرسانی: ' + toFa(String(ratesCache.time || '').replace('T', ' ').slice(0, 16)));
    renderRates(ratesCache.items, note);
  }
  autoRefreshRates();
}

/* ══════════════════════ entry sheet ══════════════════════ */
function fillDescChips() {
  var box = $('descChips');
  if (!box) return;
  var seen = {}, arr = [];
  for (var i = 0; i < entries.length && arr.length < 8; i++) {
    var d = entries[i].desc;
    if (d && d !== 'بدون توضیح' && !seen[d]) { seen[d] = 1; arr.push(d); }
  }
  if (!arr.length) { box.innerHTML = ''; return; }
  box.innerHTML = arr.map(function (d) {
    return '<button class="chip-btn" data-act="desc" data-v="' + esc(d) + '">' + esc(d) + '</button>';
  }).join('');
}

function openEntry(mode, id) {
  var e = (mode === 'edit' && id) ? entryById(id) : null;
  if (mode === 'edit' && !e) return;

  state.entryMode = e ? 'edit' : 'add';
  state.editId = e ? e.id : '';
  state.amountRaw = e ? String(Math.round(e.amount / 1000)) : '';
  state.entryType = e ? e.type : (state.entryType || 'expense');

  var accName = e ? e.card : state.entryAcc;
  if (!accName || !accByName(accName)) accName = accounts.length ? accounts[0].name : '';
  state.entryAcc = accName;
  state.entryWho = e ? (e.who || 'me') : (state.entryWho || 'me');

  var j = nowJ();
  state.entryDate = e
    ? { y: e.year, m: e.month, d: e.day }
    : { y: j.y, m: j.m, d: j.d };

  var descEl = $('entryDesc');
  if (descEl) descEl.value = e ? e.desc : '';
  setText('sheetEntryTitle', e ? 'ویرایش تراکنش' : 'ثبت جدید');
  var del = $('btnEntryDelete');
  if (del) del.hidden = !e;

  fillDescChips();
  renderEntrySheet();
  openBox('sheetEntry');
}

function renderEntrySheet() {
  var segs = document.querySelectorAll('#entryType .seg-btn');
  for (var i = 0; i < segs.length; i++) {
    segs[i].classList.toggle('is-on', segs[i].dataset.t === state.entryType);
  }

  var amtEl = $('amtDisplay');
  if (amtEl) {
    if (state.amountRaw) {
      amtEl.textContent = toFa(Number(state.amountRaw).toLocaleString('en-US').replace(/,/g, '٬'));
    } else {
      amtEl.textContent = '۰';
    }
    amtEl.classList.toggle('is-empty', !state.amountRaw);
  }
  setText('amtHint', state.amountRaw
    ? '= ' + fmt(Number(state.amountRaw) * 1000) + ' تومان'
    : '');

  var ph = '';
  accounts.forEach(function (a) {
    ph += '<button class="pill c-' + a.color + (state.entryAcc === a.name ? ' is-on' : '') + '"' +
          ' data-act="eacc" data-v="' + esc(a.name) + '">' + a.icon + ' ' + esc(a.name) + '</button>';
  });
  setHTML('entryAcc', ph || '<span class="muted">حسابی تعریف نشده</span>');

  var opts = [['me', '👤 خودم'], ['family', '👨‍👩‍👧 خانواده']];
  var wh = '';
  opts.forEach(function (o) {
    wh += '<button class="pill' + (state.entryWho === o[0] ? ' is-on' : '') + '"' +
          ' data-act="ewho" data-v="' + o[0] + '">' + o[1] + '</button>';
  });
  setHTML('entryWho', wh);

  var d = state.entryDate || nowJ();
  setText('entryDateText', prettyDate(d.y, d.m, d.d));

  var btn = $('btnEntrySubmit');
  if (btn) {
    var inc = state.entryType === 'income';
    btn.className = 'btn ' + (inc ? 'inc' : 'exp');
    btn.textContent = state.entryMode === 'edit' ? 'ذخیره تغییرات' : ('ثبت ' + (inc ? 'دخل' : 'خرج'));
  }
}

function keypadPress(k) {
  var raw = state.amountRaw;
  if (k === 'del') raw = raw.slice(0, -1);
  else if (k === 'clear') raw = '';
  else if (k === '000') { if (raw && raw !== '0') raw += '000'; }
  else if (/^[0-9]$/.test(k)) {
    if (raw.length < 10) raw = (raw === '0' ? '' : raw) + k;
  }
  state.amountRaw = raw;
  renderEntrySheet();
  buzz(6);
}

function submitEntry() {
  var thousands = parseInt(state.amountRaw, 10) || 0;
  if (thousands <= 0) { toast('مبلغ را وارد کن'); return; }

  var descEl = $('entryDesc');
  var desc = (descEl ? descEl.value : '').trim();
  if (!desc) { toast('توضیح را وارد کن'); if (descEl) descEl.focus(); return; }
  if (!accounts.length) { toast('اول یک حساب بساز'); return; }

  var cardName = state.entryAcc || accounts[0].name;
  var d = state.entryDate || nowJ();
  if (!validDate(d.y, d.m, d.d)) { toast('تاریخ درست نیست'); return; }

  var amount = thousands * 1000;
  var j = nowJ();

  if (state.entryMode === 'edit') {
    var e = entryById(state.editId);
    if (!e) { closeBox('sheetEntry'); return; }
    applyBalance(e.card, e.type, e.amount, -1);
    e.type = state.entryType;
    e.amount = amount;
    e.desc = desc;
    e.card = cardName;
    e.who = state.entryWho;
    e.year = d.y;
    e.month = d.m;
    e.day = d.d;
    e.date = dateString(e.year, e.month, e.day, e.time);
    applyBalance(e.card, e.type, e.amount, 1);
    persistEntries();
  } else {
    var ne = normEntry({
      type: state.entryType, amount: amount, desc: desc, card: cardName,
      who: state.entryWho, year: d.y, month: d.m, day: d.d, time: j.time
    });
    entries.unshift(ne);
    applyBalance(cardName, ne.type, ne.amount, 1);
    persistEntries();
  }

  rememberLast();
  state.limit = 12;
  state.amountRaw = '';
  closeBox('sheetEntry');
  renderAll();
  toast(state.entryMode === 'edit' ? 'ویرایش شد ✓' : 'ثبت شد ✓');
  buzz(12);
}

function deleteCurrentEntry() {
  var e = entryById(state.editId);
  if (!e) return;
  if (!confirm('این تراکنش پاک شود؟')) return;
  applyBalance(e.card, e.type, e.amount, -1);
  entries = entries.filter(function (x) { return x.id !== e.id; });
  persistEntries();
  closeBox('sheetEntry');
  renderAll();
  toast('پاک شد');
}

/* ══════════════════════ debt sheet ══════════════════════ */
function openDebt(id) {
  var d = id ? debtById(id) : null;
  state.debtEditId = d ? d.id : '';
  setText('debtSheetTitle', d ? 'ویرایش' :
    (state.debtType === 'creditor' ? 'ثبت طلب‌کاری' : 'ثبت بده‌کاری'));

  var n = $('debtName'), a = $('debtAmt'), x = $('debtDesc');
  if (n) n.value = d ? d.name : '';
  if (a) a.value = d ? toFa(Math.round(d.amount / 1000).toLocaleString('en-US').replace(/,/g, '٬')) : '';
  if (x) x.value = (d && d.desc !== '—') ? d.desc : '';

  var del = $('btnDebtDelete');
  if (del) del.hidden = !d;

  openBox('sheetDebt');
  if (!d) setTimeout(function () { if (n) n.focus(); }, 320);
}

function submitDebt() {
  var nameEl = $('debtName'), amtEl = $('debtAmt'), descEl = $('debtDesc');
  var name = (nameEl ? nameEl.value : '').trim();
  var thousands = parseInt(digitsOnly(amtEl ? amtEl.value : ''), 10) || 0;
  if (!name) { toast('اسم را وارد کن'); return; }
  if (thousands <= 0) { toast('مبلغ را وارد کن'); return; }

  var desc = (descEl ? descEl.value : '').trim() || '—';
  var j = nowJ();

  if (state.debtEditId) {
    var d = debtById(state.debtEditId);
    if (d) { d.name = name; d.amount = thousands * 1000; d.desc = desc; }
  } else {
    debts.push(normDebt({
      name: name, amount: thousands * 1000, desc: desc,
      type: state.debtType, date: j.y + '/' + pad2(j.m) + '/' + pad2(j.d), paid: false
    }));
  }
  persistDebts();
  closeBox('sheetDebt');
  renderDebts();
  toast(state.debtEditId ? 'ویرایش شد ✓' : 'ثبت شد ✓');
  buzz(10);
}

function deleteCurrentDebt() {
  var d = debtById(state.debtEditId);
  if (!d) return;
  if (!confirm('این مورد پاک شود؟')) return;
  debts = debts.filter(function (x) { return x.id !== d.id; });
  persistDebts();
  closeBox('sheetDebt');
  renderDebts();
  toast('پاک شد');
}

function togglePaid(id) {
  var d = debtById(id);
  if (!d) return;
  d.paid = !d.paid;
  persistDebts();
  renderDebts();
  toast(d.paid ? 'تسویه شد ✓' : 'به حالت قبل برگشت');
  buzz(8);
}

/* ══════════════════════ balance modal ══════════════════════ */
function updateBalSign() {
  var p = $('balPos'), n = $('balNeg');
  if (p) p.classList.toggle('is-on', !state.balNeg);
  if (n) n.classList.toggle('is-on', state.balNeg);
}
function openBalance(id) {
  var a = accById(id);
  if (!a) return;
  state.balAcc = id;
  var v = Number(balances[id]) || 0;
  state.balNeg = v < 0;
  setText('balTitle', 'موجودی ' + a.name);
  var inp = $('balInput');
  if (inp) inp.value = toFa(Math.round(Math.abs(v) / 1000).toLocaleString('en-US').replace(/,/g, '٬'));
  updateBalSign();
  openBox('modalBalance');
  setTimeout(function () { if (inp) inp.focus(); }, 320);
}
function saveBalance() {
  var el = $('balInput');
  var v = parseInt(digitsOnly(el ? el.value : ''), 10);
  if (isNaN(v)) { toast('مبلغ را وارد کن'); return; }
  var val = v * 1000;
  if (state.balNeg) val = -val;
  balances[state.balAcc] = val;
  persistBalances();
  closeBox('modalBalance');
  renderAll();
  toast('موجودی ذخیره شد ✓');
}

/* ══════════════════════ accounts modal ══════════════════════ */
function renderAccList() {
  var h = '';
  accounts.forEach(function (a) {
    h += '<div class="acc-item c-' + a.color + '">' +
           '<span class="dot"></span>' +
           '<input type="text" value="' + esc(a.name) + '" data-acc="' + esc(a.id) + '" aria-label="نام حساب">' +
           '<button class="del-btn" data-act="accdel" data-id="' + esc(a.id) + '" aria-label="حذف حساب">✕</button>' +
         '</div>';
  });
  setHTML('accList', h || '<div class="muted" style="text-align:center;padding:8px">حسابی نیست</div>');
}
function openAccounts() {
  renderAccList();
  openBox('modalAccounts');
}
function addAccount() {
  var inp = $('newAccName');
  var name = (inp ? inp.value : '').trim();
  if (!name) { toast('اسم حساب را بنویس'); return; }
  if (accByName(name)) { toast('این اسم تکراری است'); return; }

  var used = {};
  accounts.forEach(function (a) { if (a.color) used[a.color] = 1; });
  var color = COLOR_ORDER[0];
  for (var i = 0; i < COLOR_ORDER.length; i++) {
    if (!used[COLOR_ORDER[i]]) { color = COLOR_ORDER[i]; break; }
  }

  var acc = {
    id: 'a' + uid(),
    name: name,
    icon: (/نقد|جیب|پول/.test(name) ? '💵' : '💳'),
    color: color
  };
  accounts.push(acc);
  balances[acc.id] = 0;
  if (inp) inp.value = '';

  persistAccounts();
  persistBalances();
  renderAccList();
  renderAll();
  toast('حساب اضافه شد ✓');
}
function renameAccount(id, value) {
  var a = accById(id);
  if (!a) return;
  var name = (value || '').trim();
  if (!name) { renderAccList(); return; }
  if (name !== a.name && accByName(name)) {
    toast('این اسم تکراری است');
    renderAccList();
    return;
  }
  var old = a.name;
  a.name = name;
  entries.forEach(function (e) { if (e.card === old) e.card = name; });
  if (state.entryAcc === old) state.entryAcc = name;
  persistAccounts();
  persistEntries();
  renderAccList();
  renderAll();
  toast('نام حساب تغییر کرد');
}
function deleteAccount(id) {
  if (accounts.length <= 1) { toast('حداقل یک حساب لازم است'); return; }
  var a = accById(id);
  if (!a) return;
  var bal = Number(balances[id]) || 0;
  var extra = bal ? '\nموجودی و تراکنش‌های قبلی‌اش می‌مانند.' : '';
  if (!confirm('«' + a.name + '» حذف شود؟' + extra)) return;

  accounts = accounts.filter(function (x) { return x.id !== id; });
  delete balances[id];
  if (state.entryAcc === a.name) {
    state.entryAcc = accounts.length ? accounts[0].name : '';
  }
  persistAccounts();
  persistBalances();
  renderAccList();
  renderAll();
  toast('حذف شد');
}

/* ══════════════════════ date picker ══════════════════════ */
function openDatePicker() {
  var d = state.entryDate || nowJ();
  state.dpY = d.y;
  state.dpM = d.m;
  renderDatePicker();
  openBox('modalDate');
}
function renderDatePicker() {
  setText('dpTitle', MONTHS[state.dpM] + ' ' + toFa(state.dpY));
  var wd = '';
  for (var i = 0; i < 7; i++) wd += '<div>' + WEEKDAY_INITIALS[i] + '</div>';
  setHTML('dpWd', wd);

  var days = jalDaysInMonth(state.dpY, state.dpM);
  var lead = satIndex(jalMonthStartJDN(state.dpY, state.dpM));
  var sel = state.entryDate || nowJ();
  var j = nowJ();
  var h = '';
  for (var p = 0; p < lead; p++) h += '<div></div>';
  for (var d = 1; d <= days; d++) {
    var cls = 'dp-day';
    if (state.dpY === j.y && state.dpM === j.m && d === j.d) cls += ' today';
    if (state.dpY === sel.y && state.dpM === sel.m && d === sel.d) cls += ' sel';
    h += '<button class="' + cls + '" data-act="dp" data-d="' + d + '">' + toFa(d) + '</button>';
  }
  setHTML('dpGrid', h);
}
function dpMove(dir) {
  state.dpM += dir;
  if (state.dpM > 12) { state.dpM = 1; state.dpY++; }
  if (state.dpM < 1) { state.dpM = 12; state.dpY--; }
  renderDatePicker();
}

/* ══════════════════════ settings ══════════════════════ */
function openSettings() {
  var b = $('budgetInput');
  if (b) {
    b.value = budget
      ? toFa(Math.round(budget / 1000).toLocaleString('en-US').replace(/,/g, '٬'))
      : '';
  }
  setText('verLine', 'نسخه ' + toFa(VERSION));
  var bs = document.querySelectorAll('#balSeg .seg-btn');
  for (var i = 0; i < bs.length; i++) {
    bs[i].classList.toggle('is-on', bs[i].dataset.v === (state.hidden ? 'hide' : 'show'));
  }
  applyTheme(state.theme);
  openBox('sheetSettings');
}
function saveBudgetNow() {
  var el = $('budgetInput');
  var raw = digitsOnly(el ? el.value : '');
  budget = raw ? Math.abs(parseInt(raw, 10)) * 1000 : 0;
  writeJSON(SK.budget, budget);
  renderHome();
  toast(budget ? 'بودجه ذخیره شد ✓' : 'بودجه حذف شد');
}

function formatNumberInput(el) {
  var raw = digitsOnly(el.value);
  el.value = raw ? toFa(Number(raw).toLocaleString('en-US').replace(/,/g, '٬')) : '';
}

/* ══════════════════════ backup / restore / wipe ══════════════════════ */
function doBackup() {
  var payload = {
    app: 'hesabdari', version: VERSION, exportedAt: new Date().toISOString(),
    entries: entries, debts: debts, accounts: accounts,
    balances: balances, budget: budget, theme: state.theme
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'hesabdari-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  toast('بکاپ دانلود شد 💾');
}

function doRestore(file) {
  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var data = JSON.parse(String(ev.target.result || ''));
      var list = null;
      if (Array.isArray(data)) list = data;
      else if (data && Array.isArray(data.entries)) list = data.entries;
      if (!list) { toast('فایل بکاپ معتبر نیست'); return; }

      entries = list.map(normEntry);
      if (data && !Array.isArray(data)) {
        if (Array.isArray(data.debts)) debts = data.debts.map(normDebt);
        if (data.accounts) accounts = normAccounts(data.accounts);
        if (data.balances && typeof data.balances === 'object') balances = data.balances;
        if (data.budget !== undefined) budget = Math.abs(Number(data.budget)) || 0;
      }
      accounts.forEach(function (a) {
        if (typeof balances[a.id] !== 'number') {
          var v = Number(balances[a.id]);
          balances[a.id] = isNaN(v) ? 0 : v;
        }
      });
      persistAll();
      if (state.entryAcc && !accByName(state.entryAcc)) {
        state.entryAcc = accounts.length ? accounts[0].name : '';
      }
      state.limit = 12;
      renderAll();
      renderDebts();
      toast(toFa(entries.length) + ' تراکنش برگشت ✓');
    } catch (err) {
      toast('خطا: ' + (err && err.message ? err.message : 'فایل خراب است'));
    }
  };
  reader.readAsText(file);
}

function wipeAll() {
  if (!confirm('همه داده‌ها پاک شوند؟\nتراکنش‌ها، بدهی‌ها و موجودی‌ها!')) return;
  if (!confirm('مطمئنی؟ این کار برگشت‌پذیر نیست!')) return;
  entries = [];
  debts = [];
  accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
  balances = {};
  accounts.forEach(function (a) { balances[a.id] = 0; });
  budget = 0;
  state.month = null;
  state.calDay = 0;
  persistAll();
  renderAll();
  renderDebts();
  renderCal();
  updateMonthLabel();
  toast('همه داده‌ها پاک شد');
}

function checkUpdate() {
  if (!confirm('کش برنامه پاک و تازه‌سازی شود؟ (داده‌هایت پاک نمی‌شود)')) return;
  var done = function () {
    try { location.reload(); } catch (e) { location.href = location.href; }
  };
  if ('serviceWorker' in navigator) {
    Promise.all([
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }),
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        return Promise.all(rs.map(function (r) { return r.unregister(); }));
      })
    ]).then(done).catch(done);
  } else {
    done();
  }
}

/* ══════════════════════ PDF ══════════════════════ */
function genPdf() {
  var j = nowJ();
  var list, title;
  if (state.month) {
    list = entries.filter(function (e) { return e.year === state.month.y && e.month === state.month.m; });
    title = 'دخل و خرج ' + MONTHS[state.month.m] + ' ' + toFa(state.month.y);
  } else {
    list = entries.slice();
    title = 'دخل و خرج تا ' + prettyDate(j.y, j.m, j.d);
  }
  if (!list.length) { toast('تراکنشی برای این بازه نیست'); return; }

  list.sort(function (a, b) {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    if (a.day !== b.day) return a.day - b.day;
    return String(a.time || '').localeCompare(String(b.time || ''));
  });

  var totE = 0, totI = 0;
  list.forEach(function (e) {
    if (e.type === 'expense') totE += e.amount; else totI += e.amount;
  });

  function faNum(n) {
    return toFa(Math.round(n).toLocaleString('en-US').replace(/,/g, '٬'));
  }
  function txTime(e) {
    var m = String(e.date || '').match(/(\d{1,2}:\d{2})\s*$/);
    return e.time || (m ? m[1] : '00:00');
  }

  var rows = '';
  list.forEach(function (e, i) {
    var isExp = e.type === 'expense';
    var bg = (i % 2 === 0) ? (isExp ? '#FFF5F6' : '#F3FCF8') : '';
    var ds = e.year + '-' + pad2(e.month) + '-' + pad2(e.day) + ' ' + txTime(e);
    rows += '<tr' + (bg ? ' style="background:' + bg + '"' : '') + '>' +
      '<td>' + (i + 1) + '</td>' +
      '<td dir="ltr">' + ds + '</td>' +
      '<td>' + faNum(e.amount) + '</td>' +
      '<td class="desc">' + esc(e.desc) + '</td>' +
      '<td>' + esc(e.card || '') + '</td>' +
      '<td class="' + (isExp ? 'te' : 'ti') + '">' + (isExp ? 'خرج' : 'دخل') + '</td>' +
    '</tr>';
  });

  var css =
    '@page{size:A4;margin:14mm 10mm 20mm 10mm}' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{background:#fff;font-family:Vazirmatn,Tahoma,sans-serif;color:#000}' +
    'h1{font-size:17pt;font-weight:500;text-align:center;margin-bottom:4pt}' +
    'hr{border:none;border-top:.7pt solid #c9c9c9;margin-bottom:9pt}' +
    'table{width:100%;border-collapse:collapse;table-layout:fixed}' +
    'thead{display:table-header-group}tr{page-break-inside:avoid}' +
    'th{background:#2b2d45;color:#fff;font-size:8pt;font-weight:400;text-align:center;' +
    'border:.5pt solid #b4b4b4;height:22pt;padding:0 3pt}' +
    'td{font-size:7pt;line-height:9pt;text-align:center;border:.5pt solid #b4b4b4;' +
    'height:19pt;padding:0 3pt;white-space:nowrap;overflow:hidden}' +
    'td.desc{text-align:right}td.te{color:#c82828}td.ti{color:#1e823c}' +
    'tr.se td,tr.si td{font-size:10pt;white-space:normal;overflow:visible;height:25pt}' +
    'tr.se td{background:#fdecec;color:#c82828}tr.si td{background:#ecfcec;color:#1e823c}';

  var html = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8">' +
    '<title>' + esc(title) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500&display=swap" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' +
    '<h1>' + esc(title) + '</h1><hr>' +
    '<table><colgroup><col style="width:5%"><col style="width:19%"><col style="width:15%">' +
    '<col style="width:40%"><col style="width:13%"><col style="width:8%"></colgroup>' +
    '<thead><tr><th>ردیف</th><th>تاریخ و ساعت</th><th>مبلغ</th><th>بابت</th><th>حساب</th><th>نوع</th></tr></thead>' +
    '<tbody>' + rows +
    '<tr class="se"><td colspan="6">جمع خرج: ' + faNum(totE) + ' تومان</td></tr>' +
    '<tr class="si"><td colspan="6">جمع دخل: ' + faNum(totI) + ' تومان</td></tr>' +
    '</tbody></table>' +
    '<scr' + 'ipt>function go(){setTimeout(function(){window.print()},200)}' +
    'if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go)}else{setTimeout(go,700)}' +
    '</scr' + 'ipt></body></html>';

  var w = window.open('', '_blank');
  if (!w) { toast('پنجره‌ی جدید باز نشد — پاپ‌آپ را مجاز کن'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* ══════════════════════ events ══════════════════════ */
function onDocClick(ev) {
  var target = ev.target;
  while (target && target !== document && !(target.dataset && target.dataset.act)) {
    target = target.parentNode;
  }
  if (!target || target === document || !target.dataset || !target.dataset.act) return;

  switch (target.dataset.act) {
    case 'page':
      switchPage(target.dataset.page);
      break;
    case 'bal':
      openBalance(target.dataset.id);
      break;
    case 'tx':
      openEntry('edit', target.dataset.id);
      break;
    case 'debt':
      openDebt(target.dataset.id);
      break;
    case 'paid':
      togglePaid(target.dataset.id);
      break;
    case 'calday':
      var dnum = Number(target.dataset.d);
      state.calDay = (state.calDay === dnum) ? 0 : dnum;
      renderCal();
      break;
    case 'month':
      var k = target.dataset.k;
      if (k === 'all') state.month = null;
      else { var pp = k.split('/'); state.month = { y: +pp[0], m: +pp[1] }; }
      state.limit = 12;
      updateMonthLabel();
      toggleMonthMenu(false);
      renderTx();
      break;
    case 'filter':
      state.filter = target.dataset.filter;
      var fb = document.querySelectorAll('#segType .seg-btn');
      for (var i = 0; i < fb.length; i++) fb[i].classList.toggle('is-on', fb[i] === target);
      state.limit = 12;
      renderTx();
      break;
    case 'debtTab':
      state.debtType = target.dataset.debt;
      var dbt = document.querySelectorAll('#segDebt .seg-btn');
      for (var n = 0; n < dbt.length; n++) dbt[n].classList.toggle('is-on', dbt[n] === target);
      renderDebts();
      break;
    case 'theme':
      applyTheme(target.dataset.v);
      toast('تم ذخیره شد');
      break;
    case 'type':
      state.entryType = target.dataset.t;
      renderEntrySheet();
      break;
    case 'key':
      keypadPress(target.dataset.k);
      break;
    case 'eacc':
      state.entryAcc = target.dataset.v;
      renderEntrySheet();
      buzz(6);
      break;
    case 'ewho':
      state.entryWho = target.dataset.v;
      renderEntrySheet();
      buzz(6);
      break;
    case 'desc':
      var di = $('entryDesc');
      if (di) { di.value = target.dataset.v; di.focus(); }
      break;
    case 'accdel':
      deleteAccount(target.dataset.id);
      break;
    case 'dp':
      state.entryDate = { y: state.dpY, m: state.dpM, d: Number(target.dataset.d) };
      closeBox('modalDate');
      renderEntrySheet();
      break;
    case 'balVis':
      setHidden(target.dataset.v === 'hide');
      break;
  }
}

function setHidden(v) {
  state.hidden = !!v;
  writeLS('dakhel_balvis', state.hidden ? 'hide' : 'show');
  renderHome();
  var seg = document.querySelectorAll('#balSeg .seg-btn');
  for (var i = 0; i < seg.length; i++) {
    seg[i].classList.toggle('is-on', seg[i].dataset.v === (state.hidden ? 'hide' : 'show'));
  }
  buzz(8);
}

function bind() {
  $('btnTheme').addEventListener('click', cycleTheme);
  $('btnSettings').addEventListener('click', openSettings);
  $('eyeBtn').addEventListener('click', function () {
    setHidden(!state.hidden);
  });
  $('btnManageAcc').addEventListener('click', openAccounts);
  $('fab').addEventListener('click', function () {
    if (state.page === 'debts') openDebt('');
    else openEntry('add');
  });

  var qa = document.querySelectorAll('.quick .qa');
  for (var qi = 0; qi < qa.length; qi++) {
    qa[qi].addEventListener('click', function (ev) {
      ev.stopPropagation();
      var kind = this.dataset.act;
      if (kind === 'manageAcc') { openAccounts(); return; }
      if (kind === 'addDebt') { openDebt(''); return; }
      state.entryType = kind === 'addIncome' ? 'income' : 'expense';
      openEntry('add');
    });
  }

  $('monthBtn').addEventListener('click', function (ev) {
    ev.stopPropagation();
    toggleMonthMenu();
  });
  $('searchInput').addEventListener('input', function () {
    state.search = this.value;
    state.limit = 12;
    renderTx();
  });
  $('btnMore').addEventListener('click', function () {
    state.limit += 20;
    renderTx();
  });

  $('entryDate').addEventListener('click', openDatePicker);
  $('btnEntrySubmit').addEventListener('click', submitEntry);
  $('btnEntryDelete').addEventListener('click', deleteCurrentEntry);

  $('btnDebtSubmit').addEventListener('click', submitDebt);
  $('btnDebtDelete').addEventListener('click', deleteCurrentDebt);

  $('btnBalCancel').addEventListener('click', function () { closeBox('modalBalance'); });
  $('btnBalSave').addEventListener('click', saveBalance);
  $('balPos').addEventListener('click', function () { state.balNeg = false; updateBalSign(); });
  $('balNeg').addEventListener('click', function () { state.balNeg = true; updateBalSign(); });

  $('btnAddAcc').addEventListener('click', addAccount);
  $('btnAccClose').addEventListener('click', function () { closeBox('modalAccounts'); });
  $('newAccName').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); addAccount(); }
  });

  $('dpPrev').addEventListener('click', function () { dpMove(-1); });
  $('dpNext').addEventListener('click', function () { dpMove(1); });
  $('btnDpCancel').addEventListener('click', function () { closeBox('modalDate'); });
  $('btnDpToday').addEventListener('click', function () {
    var j = nowJ();
    state.entryDate = { y: j.y, m: j.m, d: j.d };
    closeBox('modalDate');
    renderEntrySheet();
  });

  $('calPrev').addEventListener('click', function () { calMove(-1); });
  $('calNext').addEventListener('click', function () { calMove(1); });

  $('btnSettingsClose').addEventListener('click', function () { closeBox('sheetSettings'); });
  $('btnSaveBudget').addEventListener('click', saveBudgetNow);
  $('btnBackup').addEventListener('click', doBackup);
  $('btnRestore').addEventListener('click', function () { $('fileIn').click(); });
  $('fileIn').addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0];
    if (f) doRestore(f);
    ev.target.value = '';
  });
  $('btnPdf').addEventListener('click', genPdf);
  $('btnInstall').addEventListener('click', function () { openBox('modalInstall'); });
  $('btnInstallClose').addEventListener('click', function () { closeBox('modalInstall'); });
  $('btnWipe').addEventListener('click', wipeAll);
  $('btnCheckUpdate').addEventListener('click', checkUpdate);
  $('btnRates').addEventListener('click', function () { refreshRates(); });

  var overlays = document.querySelectorAll('.sheet-wrap, .modal-wrap');
  for (var i = 0; i < overlays.length; i++) {
    overlays[i].addEventListener('click', function (ev) {
      if (ev.target === this) this.classList.remove('is-open');
    });
  }

  ['debtAmt', 'balInput', 'budgetInput'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', function () { formatNumberInput(this); });
  });

  document.addEventListener('click', onDocClick);

  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t || !t.getAttribute) return;
    if (t.hasAttribute('data-acc') && t.closest && t.closest('#accList')) {
      renameAccount(t.getAttribute('data-acc'), t.value);
    }
  });

  document.addEventListener('click', function (ev) {
    var menu = $('monthMenu');
    if (!menu || !menu.classList.contains('is-open')) return;
    if (ev.target.closest && (ev.target.closest('#monthMenu') || ev.target.closest('#monthBtn'))) return;
    menu.classList.remove('is-open');
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    var se = $('sheetEntry');
    if (se && se.classList.contains('is-open')) { ev.preventDefault(); submitEntry(); }
  });

  if (window.matchMedia) {
    try {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var onChange = function () { if (state.theme === 'system') applyTheme('system'); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}
  }
}

/* ══════════════════════ init ══════════════════════ */
function init() {
  var j = nowJ();
  state.calY = j.y;
  state.calM = j.m;
  if (!state.entryAcc || !accByName(state.entryAcc)) {
    state.entryAcc = accounts.length ? accounts[0].name : '';
  }

  applyTheme(state.theme);
  bind();
  renderAll();
  switchPage('home');
  updateMonthLabel();

  if (ratesCache && ratesCache.items && ratesCache.items.length) {
    renderRates(ratesCache.items, ratesCache.note ||
      ('آخرین بروزرسانی: ' + toFa(String(ratesCache.time || '').replace('T', ' ').slice(0, 16))));
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
}

document.addEventListener('DOMContentLoaded', init);

})();
