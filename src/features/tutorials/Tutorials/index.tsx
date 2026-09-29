import { Link } from 'react-router-dom';
import { ScrollReveal } from '../../../components/ui/ScrollReveal';
import type { Tutorial } from '../../../types';
import { api } from '../../../services/api';
import { transformTutorials } from '../../../utils/transformData';
import { useApiFetch } from '../../../hooks/useApiFetch';
import styles from './Tutorials.module.css';
import { collectionHref } from '../../../services/collectionCatalog';

const levelLabels: Record<string, string> = {
  A_level: '入门',
  B_level: '进阶',
  C_level: '高级',
  ALL: '不限基础',
};

function TutorialContent({ tutorial, index }: { tutorial: Tutorial; index: number }) {
  const level = levelLabels[tutorial.level] ?? tutorial.level;
  const status = tutorial.status.replace(/^A更新中/, '更新中').replace(/^B已完结/, '已完结');

  return (
    <>
      <span className={styles.tutorialIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className={styles.tutInfo}>
        <h3>{tutorial.title}</h3>
        <p>{tutorial.description}</p>
        <span className={styles.mobileMeta}>{level} · {status}</span>
      </div>
      <div className={styles.tutMeta}>
        <span className={styles.tutTag}>{level}</span>
        <span className={styles.tutStatus}>{status}</span>
      </div>
      <span className={styles.arrow} aria-hidden="true">↗</span>
    </>
  );
}

export function Tutorials() {
  const { data: tutorials, loading, error, refetch } = useApiFetch(() =>
    api.getTutorials().then(transformTutorials)
  );

  return (
    <section id="tutorials" className={styles.section} aria-labelledby="tutorials-title" aria-busy={loading}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">02 / Education</div>
              <h2 className="section-title serif" id="tutorials-title">系统化学习</h2>
            </div>
            <p className={styles.sectionNote}>
              <span>EXPLORER / 探索者</span>
              把好奇心，变成下一步。
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={styles.statusMessage} role="status">
            <span className={styles.loadingSpinner} aria-hidden="true" />
            <p>正在整理学习路径…</p>
          </div>
        ) : error ? (
          <div className={styles.statusMessage} role="status">
            <span className={styles.statusLabel}>EDUCATION / 教程</span>
            <p>教程暂时没有加载成功。</p>
            <button className={styles.retryButton} onClick={refetch}>重新加载 <span aria-hidden="true">↗</span></button>
          </div>
        ) : tutorials.length === 0 ? (
          <div className={styles.statusMessage}>
            <span className={styles.statusLabel}>STAY CURIOUS, KEEP LEARNING</span>
            <p>学习从好奇开始，新的教程即将更新。</p>
          </div>
        ) : (
          <div className={styles.tutorialsList}>
            {tutorials.map((tutorial, index) => (
              <ScrollReveal key={tutorial.id} delay={Math.min(index, 3) * 0.08}>
                <Link to={tutorial.link} className={styles.tutorialRow}>
                  <TutorialContent tutorial={tutorial} index={index} />
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
        <div className="section-related"><span>换一种方式学习</span><Link to={collectionHref('reading')}>延伸阅读 · 值得一读 <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>
  );
}
