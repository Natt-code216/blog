import { Link } from 'react-router-dom';
import { ScrollReveal } from '../../../components/ui/ScrollReveal';
import type { Essay } from '../../../types';
import { api } from '../../../services/api';
import { transformEssays } from '../../../utils/transformData';
import { useApiFetch } from '../../../hooks/useApiFetch';
import styles from './Essays.module.css';

const categoryLabels: Record<string, string> = {
  ESSAY: 'ESSAY / 随笔',
  THOUGHTS: 'THOUGHTS / 思考',
  LIFESTYLE: 'LIFESTYLE / 生活',
};

function EssayCard({ essay }: { essay: Essay }) {
  return (
    <>
      <div className={styles.essayMeta}>
        <span>{categoryLabels[essay.category] ?? essay.category}</span>
        <span>{essay.date.replace(/\//g, '.')}</span>
      </div>
      <h3 className="serif">{essay.title}</h3>
      <p>{essay.excerpt}</p>
      <span className={styles.readMoreLink}>
        阅读全文
        <span aria-hidden="true">↗</span>
      </span>
    </>
  );
}

export function Essays() {
  const { data: essays, loading, error, refetch } = useApiFetch(() =>
    api.getEssays().then(transformEssays)
  );

  return (
    <section id="essays" className={styles.section} aria-labelledby="essays-title" aria-busy={loading}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">01 / Journal</div>
              <h2 className="section-title serif" id="essays-title">思考与感悟</h2>
            </div>
            <p className={styles.sectionNote}>
              <span>THINKER / 思考者</span>
              记录日常，也记录自己。
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={styles.statusMessage} role="status">
            <span className={styles.loadingSpinner} aria-hidden="true" />
            <p>正在翻开随笔…</p>
          </div>
        ) : error ? (
          <div className={styles.statusMessage} role="status">
            <span className={styles.statusLabel}>JOURNAL / 随笔</span>
            <p>随笔暂时没有加载成功。</p>
            <button className={styles.retryButton} onClick={refetch}>重新加载 <span aria-hidden="true">↗</span></button>
          </div>
        ) : essays.length === 0 ? (
          <div className={styles.statusMessage}>
            <span className={styles.statusLabel}>A LITTLE SPACE FOR THOUGHTS</span>
            <p>新的思考正在酝酿，随笔即将更新。</p>
          </div>
        ) : (
          <div className={styles.essaysGrid}>
            {essays.map((essay, index) => (
              <ScrollReveal key={essay.id} delay={Math.min(index, 3) * 0.08}>
                <Link to={essay.link} className={styles.essayCard} aria-label={`阅读全文：${essay.title}`}>
                  <EssayCard essay={essay} />
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
