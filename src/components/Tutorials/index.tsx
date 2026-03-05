import { useEffect, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal';
import type { Tutorial } from '../../types';
import { api } from '../../services/api';
import { transformTutorials } from '../../utils/transformData';
import styles from './Tutorials.module.css';

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
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const apiData = await api.getTutorials();
        setTutorials(transformTutorials(apiData));
        setLoading(false);
      } catch (err) {
        console.error('获取教程失败:', err);
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) {
    return (
      <section id="tutorials" className={styles.section}>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </section>
    );
  }

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
          {tutorials.map((tutorial, index) => (
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
