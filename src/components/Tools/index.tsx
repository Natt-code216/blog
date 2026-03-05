import { useEffect, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal';
import type { Tool } from '../../types';
import { api } from '../../services/api';
import { transformTools } from '../../utils/transformData';
import styles from './Tools.module.css';

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
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const apiData = await api.getTools();
        setTools(transformTools(apiData));
        setLoading(false);
      } catch (err) {
        console.error('获取工具失败:', err);
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  if (loading) {
    return (
      <section id="tools" className={styles.section}>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </section>
    );
  }

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
          {tools.map((tool, index) => (
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
