import './init';
import './directory.css';
import { localTools } from '../../../services/toolCatalog';
import { withToolQuery } from './navigation';

const groups = [
  { id: 'files', title: '文件与图片', label: '01 / FILES', description: '整理文件，处理图片。' },
  { id: 'data', title: '文本与数据', label: '02 / DATA', description: '把信息，变得清楚。' },
  { id: 'daily', title: '日常实用', label: '03 / EVERYDAY', description: '随手打开，省一点力。' },
];
const symbols: Record<string, string> = {
  'json-formatter': '{}', 'markdown-html': 'M↓', 'image-compressor': '↙↗',
  'pdf-merger': 'PDF+', 'pdf-splitter': 'PDF−', 'image-to-pdf': 'IMG',
  'csv-json': '↔', 'base64': '64', 'qrcode': '▦', 'word-counter': 'Aa', 'timestamp': '↻',
};
const input = document.querySelector<HTMLInputElement>('#tool-search')!;
const container = document.querySelector<HTMLElement>('#tool-groups')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const empty = document.querySelector<HTMLElement>('#empty')!;
input.value = new URLSearchParams(location.search).get('q') ?? '';

function render() {
  const query = input.value.trim().toLowerCase();
  const matches = localTools.filter(tool => `${tool.title} ${tool.description}`.toLowerCase().includes(query));
  container.replaceChildren();
  for (const group of groups) {
    const tools = matches.filter(tool => tool.category === group.id);
    if (!tools.length) continue;
    const section = document.createElement('section');
    section.className = `directory-group group-${group.id}`;
    section.setAttribute('aria-labelledby', `heading-${group.id}`);
    section.innerHTML = `<div class="directory-group-heading"><div><span>${group.label}</span><h2 id="heading-${group.id}">${group.title}</h2></div><p>${group.description}</p></div>`;
    const grid = document.createElement('div');
    grid.className = 'directory-grid';
    for (const tool of tools) {
      const link = document.createElement('a');
      link.className = 'directory-tool';
      link.href = withToolQuery(tool.href, input.value);
      const icon = document.createElement('span');
      icon.className = 'directory-icon';
      icon.textContent = symbols[tool.id];
      icon.setAttribute('aria-hidden', 'true');
      const title = document.createElement('h3');
      title.textContent = tool.title;
      const description = document.createElement('p');
      description.textContent = tool.description;
      const arrow = document.createElement('span');
      arrow.className = 'directory-arrow';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      link.append(icon, title, description, arrow);
      grid.append(link);
    }
    section.append(grid);
    container.append(section);
  }
  count.textContent = query ? `找到 ${matches.length} 个工具` : `${localTools.length} 个工具 · ${groups.length} 类日常需求`;
  empty.hidden = matches.length > 0;
}
input.addEventListener('input', () => {
  const url = new URL(location.href);
  const query = input.value.trim();
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  history.replaceState(history.state, '', url);
  render();
});
render();
