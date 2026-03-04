import { useScrollSpy } from '../../hooks/useScrollSpy';
import styles from './Navbar.module.css';
import { useEffect, useState } from 'react';

const navItems = [
  { id: 'home', label: '首页', href: '#home' },
  { id: 'essays', label: '随笔', href: '#essays' },
  { id: 'tutorials', label: '教程', href: '#tutorials' },
  { id: 'tools', label: '工具集', href: '#tools' },
];

export function Navbar() {
  const activeId = useScrollSpy({ sectionIds: navItems.map((item) => item.id) });
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
        <a href="#home" className={`${styles.logo} serif`}>
          我的<span>空间.</span>
        </a>
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className={`${styles.navLink} ${activeId === item.id ? styles.active : ''}`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
