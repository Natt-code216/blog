import { ScrollReveal } from '../ScrollReveal';
import type { Essay } from '../../types';
import styles from './Essays.module.css';

const essaysData: Essay[] = [
  {
    id: '1',
    category: 'ESSAY',
    date: 'MAR 01, 2025',
    title: '技术与人性的平衡',
    excerpt:
      '在这个快速发展的时代，我们常常被技术的浪潮裹挟前行。然而，最重要的是保持对人性的关怀，让技术真正服务于个体的成长而非异化...',
    link: '#',
  },
  {
    id: '2',
    category: 'THOUGHTS',
    date: 'FEB 15, 2025',
    title: '关于创造力的本源思考',
    excerpt:
      '创造力绝不是凭空而来的神启，而是长期积累与深度思考在特定时刻的必然交汇。它要求我们保持对世界的好奇，以及拥抱未知的勇气...',
    link: '#',
  },
  {
    id: '3',
    category: 'LIFESTYLE',
    date: 'JAN 28, 2025',
    title: '慢下来的艺术与哲学',
    excerpt:
      '在效率至上的算法社会中，我们逐渐丧失了"慢"的能力。有时候，主动放慢脚步，去注视一朵花的盛开，反而能让我们在精神上走得更远...',
    link: '#',
  },
];

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
  return (
    <section id="essays" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">Journal</div>
              <h2 className="section-title serif">思考与感悟</h2>
            </div>
            <a href="#" className={styles.viewAllLink}>
              查看全部
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
            </a>
          </div>
        </ScrollReveal>

        <div className={styles.essaysGrid}>
          {essaysData.map((essay, index) => (
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
