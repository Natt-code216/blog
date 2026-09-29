import '../workbench/init';
import './word-counter.css';
import { analyzeText } from './text-helpers';
import { copyText, showStatus } from './text-ui';

const input = document.getElementById('t');
const stats = document.getElementById('stats');
const status = document.getElementById('msg');
const cells = Object.keys(analyzeText('')).map(label => {
  const card = document.createElement('div'); card.className = 'stat';
  const name = document.createElement('div'); name.className = 'lbl'; name.textContent = label;
  const value = document.createElement('div'); value.className = 'val';
  card.append(name, value); stats.append(card);
  return [label, value];
});
function render() {
  const values = analyzeText(input.value);
  cells.forEach(([label, element]) => { element.textContent = values[label]; });
  showStatus(status);
}
input.addEventListener('input', render);
document.getElementById('copy').addEventListener('click', () => copyText(input.value, status));
document.getElementById('clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
render();
