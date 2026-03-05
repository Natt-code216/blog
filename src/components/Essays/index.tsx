import { useEffect, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal';
import type { Essay } from '../../types';
import { api } from '../../services/api';
import { transformEssays } from '../../utils/transformData';
import styles from './Essays.module.css';

function EssayCard({ essay }: { essay: Essay }) {
  return (
    <>
      <div className={styles.essayMeta}>
        <span>{essay.category}</span>
        <span>{essay.date}</span>
      </div>
      <h3 className="serif">{essay.title}</h3>
      <p>{essay.excerpt}</p>
      <span className={styles.readMoreLink}>
        阅读全文
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </>
  );
}

export function Essays() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEssays = async () => {
      try {
        const apiData = await api.getEssays();
        setEssays(transformEssays(apiData));
        setLoading(false);
      } catch (err) {
        console.error('获取随笔失败:', err);
        setLoading(false);
      }
    };

    fetchEssays();
  }, []);

  if (loading) {
    return (
      <section id="essays" className={styles.section}>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="essays" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">Journal</div>
              <h2 className="section-title serif">思考与感悟</h2>
            </div>
          </div>
        </ScrollReveal>

        <div className={styles.essaysGrid}>
          {essays.map((essay, index) => (
            <ScrollReveal key={essay.id} delay={index * 0.1}>
              <a href={essay.link} className={styles.essayCard}>
                <EssayCard essay={essay} />
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
