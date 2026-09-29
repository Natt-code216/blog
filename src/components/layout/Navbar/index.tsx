import { useScrollSpy } from '../../../hooks/useScrollSpy';
import styles from './Navbar.module.css';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolboxHref } from '../../../services/toolCatalog';
import { collectionHref } from '../../../services/collectionCatalog';
import { ThemeToggle } from '../../ui/ThemeToggle';

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
    <nav aria-label="主导航" className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={`${styles.logo} serif`}>
          我的<span>空间.</span>
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
        <div className={styles.appearance}><ThemeToggle /></div>
      </div>
    </nav>
  );
}
