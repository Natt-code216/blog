import { ScrollReveal } from '../ScrollReveal';
import type { Tutorial } from '../../types';
import styles from './Tutorials.module.css';

const tutorialsData: Tutorial[] = [
  {
    id: '1',
    icon: 'code',
    title: '现代前端架构指南',
    description: '深入探讨 React / Vue 生态、状态管理艺术与企业级项目工程化实践。',
    level: '中高级',
    status: '更新中 (12 章)',
    link: '#',
  },
  {
    id: '2',
    icon: 'layers',
    title: 'UI/UX 美学与极简设计',
    description: '探寻排版、色彩理论与留白艺术，运用 Figma 打造克制而优雅的界面。',
    level: '全阶段',
    status: '已完结 (8 章)',
    link: '#',
  },
  {
    id: '3',
    icon: 'zap',
    title: 'Web 极致性能优化',
    description: '从渲染管线到网络协议，系统解析毫秒级页面加载背后的底层逻辑。',
    level: '高阶',
    status: '更新中 (6 章)',
    link: '#',
  },
];

const iconMap = {
  code: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  ),
  layers: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22v-6.5" />
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
};

function TutorialContent({ tutorial }: { tutorial: Tutorial }) {
  return (
    <>
      <div className={styles.tutIconWrapper}>{iconMap[tutorial.icon]}</div>
      <div className={styles.tutInfo}>
        <h3>{tutorial.title}</h3>
        <p>{tutorial.description}</p>
      </div>
      <div className={styles.tutMeta}>
        <span className={styles.tutTag}>{tutorial.level}</span>
        <span className={styles.tutStatus}>{tutorial.status}</span>
      </div>
    </>
  );
}

export function Tutorials() {
  return (
    <section id="tutorials" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">Education</div>
              <h2 className="section-title serif">系统化学习</h2>
            </div>
          </div>
        </ScrollReveal>

        <div className={styles.tutorialsList}>
          {tutorialsData.map((tutorial, index) => (
            <ScrollReveal key={tutorial.id} delay={index * 0.1}>
              <a href={tutorial.link} className={styles.tutorialRow}>
                <TutorialContent tutorial={tutorial} />
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
