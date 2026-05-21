import { useScrollSpy } from '../../hooks/useScrollSpy';
import styles from './Navbar.module.css';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'home', label: '首页', href: '#home' },
  { id: 'essays', label: '随笔', href: '#essays' },
  { id: 'tutorials', label: '教程', href: '#tutorials' },
  { id: 'tools', label: '工具集', href: '#tools' },
];

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const activeId = useScrollSpy({
    sectionIds: isHome ? navItems.map((item) => item.id) : [],
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
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <Link to="/" className={`${styles.logo} serif`}>
          我的<span>空间.</span>
        </Link>
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              {isHome ? (
                <a
                  href={item.href}
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
      </div>
    </nav>
  );
}
