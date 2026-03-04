import { ScrollReveal } from '../ScrollReveal';
import type { Tool } from '../../types';
import styles from './Tools.module.css';

const toolsData: Tool[] = [
  {
    id: '1',
    icon: 'barChart',
    title: '数据洞察视图',
    description: '将复杂的 CSV、JSON 数据瞬间转化为优雅直观的统计图表，支持极简主题导出。',
    link: '#',
  },
  {
    id: '2',
    icon: 'droplet',
    title: '色彩调和引擎',
    description: '基于色彩理论与高阶算法，为您生成专业、和谐且符合无障碍标准的调色板。',
    link: '#',
  },
  {
    id: '3',
    icon: 'fileText',
    title: 'Markdown 沉浸创作',
    description: '提供所见即所得的沉浸式 Markdown 写作体验，支持导出纯净版 PDF 与 HTML。',
    link: '#',
  },
  {
    id: '4',
    icon: 'search',
    title: '正则可视化调试',
    description: '将晦涩的正则表达式转换为清晰的状态机图表，让正则编写与调试不再枯燥。',
    link: '#',
  },
];

const iconMap = {
  barChart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  droplet: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  fileText: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
};

function ToolContent({ tool }: { tool: Tool }) {
  return (
    <>
      <div className={styles.toolIcon}>{iconMap[tool.icon]}</div>
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
    </>
  );
}

export function Tools() {
  return (
    <section id="tools" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">Workspace</div>
              <h2 className="section-title serif">实用工具集</h2>
            </div>
          </div>
        </ScrollReveal>

        <div className={styles.toolsGrid}>
          {toolsData.map((tool, index) => (
            <ScrollReveal key={tool.id} delay={index * 0.1}>
              <a href={tool.link} className={styles.toolCard}>
                <ToolContent tool={tool} />
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
