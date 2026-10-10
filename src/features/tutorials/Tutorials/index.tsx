import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '../../../components/ui/ScrollReveal';
import { Sculpture } from '../../home/Exhibition/Sculpture';
import { api } from '../../../services/api';
import { transformTutorials } from '../../../utils/transformData';
import { useApiFetch } from '../../../hooks/useApiFetch';
import { collectionHref } from '../../../services/collectionCatalog';
import styles from './Tutorials.module.css';

const levelLabels: Record<string, string> = { A_level: '入门', B_level: '进阶', C_level: '高级', ALL: '不限基础' };

export function Tutorials() {
  const { data: tutorials, loading, error, refetch } = useApiFetch(() => api.getTutorials().then(transformTutorials));
  const [selected, setSelected] = useState(0);
  const activeIndex = Math.min(selected, Math.max(0, tutorials.length - 1));
  const active = tutorials[activeIndex];
  return <section id="tutorials" className={styles.section} aria-labelledby="tutorials-title" aria-busy={loading}>
    <div className="container">
      <ScrollReveal><div className="section-header">
        <div><p className="section-subtitle">02 / CELESTIAL PATHWAYS</p><h2 className="section-title serif" id="tutorials-title">系统化学习</h2></div>
        <p className="section-note"><span>FOLLOW YOUR CURIOSITY</span>每一次学习，都是一次抵达。</p>
      </div></ScrollReveal>
      {loading || error || !tutorials.length ? <div className={styles.statusMessage} role="status"><span className={styles.statusLabel}>MAPPING THE NEXT ORBIT</span><p>{loading ? '正在整理学习路径…' : error ? '教程暂时没有加载成功。' : '学习从好奇开始，新的教程即将更新。'}</p>{error && <button className={styles.retryButton} onClick={refetch}>重新加载 ↗</button>}</div> :
        <ScrollReveal><div className={styles.observatory}>
          <div className={styles.visual}>
            <img className={styles.painting} src="/images/cosmic-waterlilies.webp" width="1586" height="992" alt="" loading="lazy" decoding="async" />
            <Sculpture variant="learning" activeIndex={activeIndex} />
            <div className={styles.coursePreview} key={active.id} data-motion-entry>
              <span className={styles.currentCoordinate}>当前航线 <b>{String(activeIndex + 1).padStart(2,'0')}</b> / {String(tutorials.length).padStart(2,'0')}</span>
              <p className={styles.previewTitle}>{active.title}</p>
              <p className={styles.previewDescription}>{active.description}</p>
              <Link className={styles.start} to={active.link}>进入这条航线 <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className={styles.directory}>
            <div className={styles.directoryHead}><span>CHOOSE A PATH</span><span>{String(tutorials.length).padStart(2,'0')} 条学习航线</span></div>
            <div className={styles.tutorialsList}>
              {tutorials.map((tutorial, index) => <Link key={tutorial.id} to={tutorial.link} className={`${styles.tutorialRow} ${index === activeIndex ? styles.active : ''}`} onPointerEnter={() => setSelected(index)} onFocus={() => setSelected(index)}>
                <span className={styles.tutorialIndex} aria-hidden="true">{String(index + 1).padStart(2,'0')}</span>
                <div className={styles.tutInfo}><h3>{tutorial.title}</h3><div className={styles.tutMeta}><span>{levelLabels[tutorial.level] ?? tutorial.level}</span><span>{tutorial.status.replace(/^A更新中/, '更新中').replace(/^B已完结/, '已完结')}</span></div></div>
                <span className={styles.arrow} aria-hidden="true">↗</span>
              </Link>)}
            </div>
            <p className={styles.directoryNote}>从感兴趣的一站开始，点击即可进入。</p>
          </div>
        </div></ScrollReveal>}
      <div className="section-related"><span>想换一种方式学习？</span><Link to={collectionHref('reading')}>沿着别人的思想，再走远一点 <span aria-hidden="true">↗</span></Link></div>
    </div>
  </section>;
}
