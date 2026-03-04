import { ScrollReveal } from '../ScrollReveal';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="home" className={styles.hero}>
      <div className="container">
        <ScrollReveal>
          <div>
            <span className={styles.heroLabel}>Portfolio & Journal</span>
            <h1 className={`${styles.heroTitle} serif`}>
              创造者 <i>/</i> 思考者 <i>/</i> 探索者
            </h1>
            <p className={styles.heroDesc}>
              我是一名热爱技术与创作的开发者，致力于探索技术与人文的交汇点。
              <br />
              在这里，我分享我的技术心得、思想随笔，以及精心打造的实用工具。
              <br />
              希望这份沉淀，能为你的旅程带来一丝灵感。
            </p>
            <a href="#essays" className={styles.btn}>
              探索内容
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
