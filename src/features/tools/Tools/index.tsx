import { ScrollReveal } from '../../../components/ui/ScrollReveal';
import { api } from '../../../services/api';
import { localTools, toolboxHref } from '../../../services/toolCatalog';
import { transformTools } from '../../../utils/transformData';
import { useApiFetch } from '../../../hooks/useApiFetch';
import styles from './Tools.module.css';
import { Link } from 'react-router-dom';
import { collectionHref } from '../../../services/collectionCatalog';

const shortcuts = [
  { id: 'image-compressor', label: '图片压缩' },
  { id: 'pdf-merger', label: 'PDF 合并' },
  { id: 'timestamp', label: '时间戳转换' },
  { id: 'word-counter', label: '字数统计' },
];

export function Tools() {
  const { data: tools, loading, error, refetch } = useApiFetch(() =>
    api.getTools().then(transformTools)
  );
  const recommendations = tools.filter((tool) =>
    tool.link && tool.link !== '#' && !localTools.some((local) => local.href === tool.link)
  );

  return (
    <section id="tools" className={styles.section} aria-labelledby="tools-title">
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">03 / WORKSPACE</div>
              <h2 id="tools-title" className="section-title serif">实用工具集</h2>
            </div>
            <p className="section-note"><span>CREATOR / 创造者</span>动手做一点，让日常轻一点。</p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className={styles.projectGrid}>
            <article className={`${styles.project} ${styles.toolbox}`}>
              <a href={toolboxHref} aria-label={`打开工具箱，${localTools.length} 个实用小工具`}>
                <div className={styles.projectTop}>
                  <span className={styles.cardTag}>THE EVERYDAY KIT</span>
                  <span className={styles.projectNumber}>001 — TOOLS</span>
                </div>
                <div className={styles.toolCanvas} aria-hidden="true">
                  <div className={`${styles.toolTile} ${styles.tileOne}`}><span>{'{ }'}</span><small>JSON</small></div>
                  <div className={`${styles.toolTile} ${styles.tileTwo}`}><span>↗</span><small>MAKE IT EASY</small></div>
                  <div className={`${styles.toolTile} ${styles.tileThree}`}><span>M↓</span><small>MARKDOWN</small></div>
                </div>
                <div className={styles.projectCopy}>
                  <h3>小工具，大用处。</h3>
                  <p>JSON 格式化、图片压缩、PDF 处理……<br />{localTools.length} 个实用小工具，把琐事交给代码。</p>
                  <div className={styles.cardBottom}>
                    <span>{localTools.length} TOOLS / ONE TOOLBOX</span>
                    <span className={styles.arrowDisc} aria-hidden="true">↗</span>
                  </div>
                </div>
              </a>
            </article>

            <article className={`${styles.project} ${styles.smallProject} ${styles.jsonProject}`}>
              <a href={localTools.find((tool) => tool.id === 'json-formatter')!.href} aria-label="打开 JSON 格式化工具">
                <div className={styles.projectCopy}>
                  <p className={styles.cardKicker}>002 — JSON FORMATTER</p>
                  <h3>让数据，<br />井井有条。</h3>
                  <p>格式化、压缩与校验，让 JSON 变得清楚。</p>
                  <div className={styles.cardBottom}>FORMAT / VALIDATE <span aria-hidden="true">↗</span></div>
                </div>
                <div className={styles.stackVisual} aria-hidden="true"><div>VALIDATE</div><div>FORMAT</div><div>{'{ JSON }'}</div></div>
              </a>
            </article>

            <article className={`${styles.project} ${styles.smallProject} ${styles.markdownProject}`}>
              <a href={localTools.find((tool) => tool.id === 'markdown-html')!.href} aria-label="打开 Markdown 编辑与预览工具">
                <div className={styles.projectCopy}>
                  <p className={styles.cardKicker}>003 — MARKDOWN</p>
                  <h3>把想法，写下来。</h3>
                  <p>一边写，一边预览，让文字慢慢成形。</p>
                  <div className={styles.cardBottom}>WRITE / PREVIEW / EXPORT <span aria-hidden="true">↗</span></div>
                </div>
                <div className={styles.noteVisual} aria-hidden="true"><i /><i /><i /></div>
              </a>
            </article>
          </div>
          <div className={styles.shortcuts}>
            <span>也可以直接试试</span>
            {shortcuts.map(({ id, label }) => (
              <a key={id} href={localTools.find((tool) => tool.id === id)!.href}>{label} <span aria-hidden="true">↗</span></a>
            ))}
          </div>
        </ScrollReveal>

        {recommendations.length > 0 && (
          <div className={styles.recommendations}>
            <h3>更多工具推荐</h3>
            <div className={styles.recommendationGrid}>
              {recommendations.map((tool) => (
                <a key={tool.id} href={tool.link} className={styles.recommendation}>
                  <h4>{tool.title} <span aria-hidden="true">↗</span></h4>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="section-related"><span>再去别处逛逛</span><Link to={collectionHref('sites')}>看看我的私藏网站 <span aria-hidden="true">↗</span></Link></div>
        {error && !loading && (
          <p className={styles.notice}>更多工具推荐暂时无法加载，以上工具仍可使用。<button type="button" onClick={refetch}>重试</button></p>
        )}
      </div>
    </section>
  );
}
