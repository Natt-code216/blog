import { Link } from 'react-router-dom';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { collectedSites, collectionHref, readingLinks, sourceDomain } from '../../services/collectionCatalog';
import styles from './Collection.module.css';

export function CollectionGateway() {
  return (
    <section id="collection" aria-labelledby="collection-title" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <p className="section-subtitle">04 / GOOD FINDS</p>
              <h2 id="collection-title" className="section-title serif">好的分享</h2>
            </div>
            <p className="section-note"><span>值得反复打开</span>留住好文章，也留住好去处。</p>
          </div>
          <div className={styles.gateGrid}>
            <Link to={collectionHref('reading')} className={styles.gate}>
              <span className={styles.gateMeta}>{readingLinks.length} ESSAYS / 值得一读</span>
              <div className={styles.fan} aria-hidden="true">
                <span className={styles.leaf}><b>Learn.</b><small>保持好奇</small></span>
                <span className={styles.leaf}><b>Think.</b><small>慢慢想</small></span>
                <span className={styles.leaf}><b>Live.</b><small>认真生活</small></span>
              </div>
              <h3>读一点，想远一点。</h3>
              <div className={styles.gateBottom}><p>关于学习、工作与生活的好文章</p><span className={styles.arrow} aria-hidden="true">↗</span></div>
            </Link>
            <Link to={collectionHref('sites')} className={`${styles.gate} ${styles.siteGate}`}>
              <span className={styles.gateMeta}>{String(collectedSites.length).padStart(2, '0')} WEBSITES / 私藏网站</span>
              <div className={styles.windows} aria-hidden="true">
                {collectedSites.slice(0, 3).map(site => (
                  <span className={styles.browserWindow} key={site.id}><i>···</i><span>{sourceDomain(site.url)} <b>↗</b></span></span>
                ))}
              </div>
              <h3>我的互联网书签。</h3>
              <div className={styles.gateBottom}><p>几个想留给你的网址</p><span className={styles.arrow} aria-hidden="true">↗</span></div>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
