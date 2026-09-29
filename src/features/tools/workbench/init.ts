import './workbench.css';
import { getTheme, subscribeTheme, toggleTheme } from '../../../app/theme';
import { toolboxHref } from '../../../services/toolCatalog';
import { getToolboxReturnHref } from './navigation';
import { collectionHref } from '../../../services/collectionCatalog';

const isIndex = /\/mini-tools\/(?:index\.html)?$/.test(location.pathname);
document.body.classList.add('workbench');
if (isIndex) document.body.classList.add('toolbox-index');

const header = document.createElement('header');
header.className = 'site-header';
header.innerHTML = `
  <a class="skip-link" href="#main">跳到主要内容</a>
  <div class="site-header-inner">
    <a class="site-brand" href="/">我的<span>空间.</span></a>
    <nav aria-label="主导航">
      <a href="/">首页</a>
      <a href="/#essays">随笔</a>
      <a href="/#tutorials">教程</a>
      <a href="${toolboxHref}" aria-current="${isIndex ? 'page' : 'location'}">工具集</a>
      <a href="${collectionHref()}">好的分享</a>
    </nav>
    <button class="theme-switch" type="button"></button>
  </div>`;
document.body.prepend(header);

const themeButton = header.querySelector<HTMLButtonElement>('.theme-switch')!;
function renderTheme() {
  const isDark = getTheme() === 'dark';
  themeButton.textContent = isDark ? '☀ 白天模式' : '☾ 夜间模式';
  themeButton.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
  themeButton.title = themeButton.getAttribute('aria-label')!;
}
themeButton.addEventListener('click', toggleTheme);
subscribeTheme(renderTheme);
renderTheme();

const main = document.querySelector<HTMLElement>('main');
if (main) {
  main.id = 'main';
  main.tabIndex = -1;
  const back = main.querySelector<HTMLAnchorElement>('a.back');
  if (!isIndex && back) back.href = getToolboxReturnHref(location.search);
}
document.querySelectorAll<HTMLElement>('.msg, .status').forEach(element => {
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-atomic', 'true');
});

const footer = document.createElement('footer');
footer.className = 'site-footer';
footer.innerHTML = `<div><span>在自己的节奏里，创造一点。</span><p>文件与文本在你的浏览器中处理。</p></div><div><a href="${toolboxHref}">全部工具 ↗</a><a href="${collectionHref('sites')}">私藏网站 ↗</a><a href="/">返回首页 ↑</a></div>`;
document.body.append(footer);
