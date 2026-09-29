import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { categoryLabel, collectedSites, readingCategories, readingLinks, sourceDomain, type CollectionView } from '../services/collectionCatalog';
import styles from '../features/collection/Collection.module.css';

export function CollectionPage() {
  const [params, setParams] = useSearchParams();
  const view: CollectionView = params.get('view') === 'sites' ? 'sites' : 'reading';
  const topic = readingCategories.find(category => category.id === params.get('topic'));
  const articles = topic ? readingLinks.filter(article => article.category === topic.id) : readingLinks;

  function changeView(next: CollectionView) {
    if (next === view) return;
    const nextParams = new URLSearchParams(params);
    nextParams.set('view', next);
    nextParams.delete('topic');
    setParams(nextParams);
  }

  function changeTopic(id?: string) {
    const nextParams = new URLSearchParams(params);
    nextParams.set('view', 'reading');
    if (id) nextParams.set('topic', id);
    else nextParams.delete('topic');
    setParams(nextParams);
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{view === 'reading' ? '值得一读' : '私藏网站'} · 我的收藏 · 我的空间</title>
        <meta name="description" content="关于学习、认知、工作与生活的精选阅读，以及几个值得再次打开的网站。" />
      </Helmet>
      <Link to="/#collection" className={styles.back}>← 返回首页收藏区</Link>
      <header className={styles.pageHeader}>
        <div>
          <p className="section-subtitle">A PERSONAL COLLECTION / 我的收藏</p>
          <h1 className="serif">值得反复打开<span className={styles.titleDot}>.</span></h1>
          <p className={styles.intro}>把值得读的文章，和想再次打开的网站，留在这里。</p>
        </div>
        <div className={styles.headerNote} aria-hidden="true"><span>{String(readingLinks.length).padStart(2, '0')} ESSAYS</span><span>{String(collectedSites.length).padStart(2, '0')} WEBSITES</span><i>Stay curious.</i></div>
      </header>

      <div className={styles.tabs} role="group" aria-label="收藏类型">
        <button type="button" aria-pressed={view === 'reading'} aria-controls="collection-results" onClick={() => changeView('reading')}>值得一读 <span>{readingLinks.length}</span></button>
        <button type="button" aria-pressed={view === 'sites'} aria-controls="collection-results" onClick={() => changeView('sites')}>私藏网站 <span>{collectedSites.length}</span></button>
      </div>

      {view === 'reading' && (
        <div className={styles.filters} role="group" aria-label="阅读主题">
          <button type="button" aria-pressed={!topic} onClick={() => changeTopic()}>全部 <span>{readingLinks.length}</span></button>
          {readingCategories.map(category => (
            <button type="button" key={category.id} aria-pressed={topic?.id === category.id} onClick={() => changeTopic(category.id)}>{category.label}</button>
          ))}
        </div>
      )}

      <div className={styles.resultHeading}>
        <h2 id="collection-results-title">{view === 'sites' ? '我的互联网书签' : topic?.label ?? '关于学习，也关于生活'}</h2>
        <p role="status" aria-live="polite" aria-atomic="true">{view === 'sites' ? `${collectedSites.length} 个网站` : `${topic?.label ?? '全部阅读'} · ${articles.length} 篇`}</p>
      </div>

      <section id="collection-results" aria-labelledby="collection-results-title">
        <div key={`${view}-${topic?.id ?? 'all'}`} className={`${styles.cardGrid} ${view === 'sites' ? styles.siteGrid : ''}`}>
          {view === 'reading' ? articles.map(article => (
            <a key={article.id} href={article.url} className={styles.readingCard} target="_blank" rel="noopener noreferrer">
              <div className={styles.cardTop}><span>{categoryLabel(article.category)}</span><span className={styles.cardNumber} aria-hidden="true">{String(readingLinks.indexOf(article) + 1).padStart(2, '0')}</span></div>
              <h3 className="serif">{article.title}</h3>
              <p className={styles.originalTitle} lang="en">{article.originalTitle}</p>
              <div className={styles.cardFooter}>
                <div><span className={styles.author}>{article.author}</span><span className={styles.domain}>{sourceDomain(article.url)}</span></div>
                <span className={styles.visit}>原文 <span aria-hidden="true">↗</span></span>
              </div>
              <span className="sr-only">（在新标签页打开英文原文）</span>
            </a>
          )) : collectedSites.map((site, index) => (
            <a key={site.id} href={site.url} className={`${styles.readingCard} ${styles.siteCard}`} target="_blank" rel="noopener noreferrer">
              <div className={styles.cardTop}><span className={styles.monogram} aria-hidden="true">{site.monogram}</span><span className={styles.cardNumber}>BOOKMARK / {String(index + 1).padStart(2, '0')}</span></div>
              <h3 className="serif">{site.title}</h3>
              <p className={styles.siteDomain}>{sourceDomain(site.url)}</p>
              {site.description && <p className={styles.siteDescription}>{site.description}</p>}
              <div className={styles.cardFooter}><span className={styles.visit}>访问网站</span><span className={styles.arrow} aria-hidden="true">↗</span></div>
              <span className="sr-only">（在新标签页打开）</span>
            </a>
          ))}
        </div>
      </section>
      <p className={styles.pageFootnote}>{view === 'reading' ? '中文标题为参考译名，点击卡片前往英文原文。' : '这些是我收藏的外部网站，点击卡片即可访问。'}<span>新标签页打开，慢慢逛。</span></p>
    </div>
  );
}
