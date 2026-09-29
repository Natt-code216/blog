import { Link, useLocation } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.inner}>
          <div>
            <Link to="/#home" className={`${styles.logo} serif`}>我的<span>空间.</span></Link>
            <p className={styles.description}>创造，思考，探索。<br />在自己的节奏里，慢慢生长。</p>
          </div>
          <div className={styles.links}>
            <a href="https://github.com/Natt-code216/blog" target="_blank" rel="noopener noreferrer">
              GitHub <span aria-hidden="true">↗</span><span className="sr-only">（在新标签页打开）</span>
            </a>
            {isHome ? <a href="#home">回到顶部 ↑</a> : <Link to="/#home">返回首页 ↑</Link>}
          </div>
        </div>
        <p className={styles.copyright}>© {new Date().getFullYear()} 我的空间 · Crafted with intention.</p>
      </div>
    </footer>
  );
}
