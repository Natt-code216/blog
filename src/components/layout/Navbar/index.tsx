import { useScrollSpy } from '../../../hooks/useScrollSpy';
import styles from './Navbar.module.css';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolboxHref } from '../../../services/toolCatalog';
import { collectionHref } from '../../../services/collectionCatalog';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { useMotion } from '../../../app/providers/MotionContext';

const navItems = [
  { id: 'home', label: '首页', href: '#home' },
  { id: 'essays', label: '随笔', href: '#essays' },
  { id: 'tutorials', label: '教程', href: '#tutorials' },
  { id: 'tools', label: '工具集', href: toolboxHref },
  { id: 'collection', label: '好的分享', href: collectionHref() },
];

const homeSectionIds = navItems.map(item => item.id);
const noSectionIds: string[] = [];

export function Navbar() {
  const { motionEnabled, toggleMotion, reducedMotion } = useMotion();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const activeId = useScrollSpy({
    sectionIds: isHome ? homeSectionIds : noSectionIds,
  });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav aria-label="主导航" className={`${styles.navbar} ${isHome && (!isScrolled || activeId === 'home') ? styles.overHero : ''} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoOrbit} aria-hidden="true">✳</span>我的<span>空间.</span>
        </Link>
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              {item.id === 'collection' ? (
                <Link
                  to={item.href}
                  aria-current={location.pathname === '/collection' ? 'page' : isHome && activeId === item.id ? 'location' : undefined}
                  className={`${styles.navLink} ${location.pathname === '/collection' || (isHome && activeId === item.id) ? styles.active : ''}`}
                >
                  {item.label}
                </Link>
              ) : isHome || item.id === 'tools' ? (
                <a
                  href={item.href}
                  aria-current={activeId === item.id ? 'location' : undefined}
                  className={`${styles.navLink} ${activeId === item.id ? styles.active : ''}`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={`/${item.href}`}
                  className={styles.navLink}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className={styles.appearance}>
          <button type="button" className={styles.motionControl} onClick={toggleMotion} disabled={reducedMotion} aria-pressed={motionEnabled} aria-label={reducedMotion ? '已遵循系统设置减少动态效果' : motionEnabled ? '暂停全站动效' : '播放全站动效'} title={reducedMotion ? '已遵循系统设置减少动态效果' : motionEnabled ? '暂停全站动效' : '播放全站动效'}><span aria-hidden="true">{motionEnabled ? 'Ⅱ' : '▷'}</span><span className={styles.motionLabel}>{reducedMotion ? '静态漫游' : motionEnabled ? '动效开启' : '动效暂停'}</span></button>
          {!isHome && <span className={styles.themeControl}><ThemeToggle /></span>}
        </div>
      </div>
    </nav>
  );
}
