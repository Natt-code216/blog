import '../workbench/init';
import './timestamp.css';
import { parseTimestamp, parseDateInput, validateOffset } from './text-helpers';
import { copyText } from './text-ui';

const $ = id => document.getElementById(id);
const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const pad = (number, length = 2) => String(number).padStart(length, '0');
function chosenOffset(date) {
  if ($('tz').value === 'local') return -date.getTimezoneOffset();
  if ($('tz').value === '0') return 0;
  return validateOffset($('off').value);
}
function formatWallTime(date, offset) {
  const wallTime = new Date(date.getTime() + offset * 60000);
  if (!Number.isFinite(wallTime.getTime())) throw new Error('日期在所选时区超出范围');
  return {
    text: `${pad(wallTime.getUTCFullYear(), 4)}-${pad(wallTime.getUTCMonth() + 1)}-${pad(wallTime.getUTCDate())} ${pad(wallTime.getUTCHours())}:${pad(wallTime.getUTCMinutes())}:${pad(wallTime.getUTCSeconds())}`,
    day: weekday[wallTime.getUTCDay()],
  };
}
function renderResult(element, getDate) {
  element.hidden = false;
  element.replaceChildren();
  try {
    const date = getDate();
    const offset = chosenOffset(date);
    const time = formatWallTime(date, offset);
    const zone = `UTC${offset >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
    const items = [
      ['秒', Math.floor(date.getTime() / 1000)], ['毫秒', date.getTime()],
      ['ISO 8601', date.toISOString()], [`日期时间（${zone}）`, time.text], ['星期', time.day],
    ];
    items.forEach(([label, value]) => {
      const row = document.createElement('div'); row.className = 'item';
      const key = document.createElement('span'); key.className = 'k'; key.textContent = label;
      const result = document.createElement('span'); result.className = 'v'; result.textContent = value;
      row.append(key, result); element.append(row);
    });
  } catch (error) {
    const message = document.createElement('p'); message.className = 'error'; message.textContent = error.message;
    element.append(message);
  }
}
function convertTimestamp() {
  renderResult($('ts2dR'), () => parseTimestamp($('ts').value, $('unit').value));
}
function convertDate() {
  renderResult($('d2tsR'), () => parseDateInput($('dt').value, $('tz').value === 'local' ? null : chosenOffset(new Date())));
}
$('ts2d').addEventListener('click', convertTimestamp);
$('d2ts').addEventListener('click', convertDate);
$('ts').addEventListener('keydown', event => { if (event.key === 'Enter') convertTimestamp(); });
['ts', 'unit'].forEach(id => $(id).addEventListener('input', () => { $('ts2dR').hidden = true; }));
$('dt').addEventListener('input', () => { $('d2tsR').hidden = true; });
function refreshResults() {
  if (!$('ts2dR').hidden) convertTimestamp();
  if (!$('d2tsR').hidden) convertDate();
}
$('tz').addEventListener('change', () => { $('off').disabled = $('tz').value !== 'custom'; refreshResults(); });
$('off').addEventListener('input', refreshResults);
function tick() { $('now').textContent = Math.floor(Date.now() / 1000); }
let timer = null;
function startClock() {
  tick();
  if (timer === null) timer = setInterval(tick, 1000);
}
function stopClock() {
  clearInterval(timer);
  timer = null;
}
window.addEventListener('pagehide', stopClock);
window.addEventListener('pageshow', startClock);
startClock();
$('copyNow').addEventListener('click', () => copyText(String(Math.floor(Date.now() / 1000)), $('nowMsg')));
$('copyMs').addEventListener('click', () => copyText(String(Date.now()), $('nowMsg')));
const now = new Date();
$('dt').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
$('ts').value = Math.floor(now.getTime() / 1000);
