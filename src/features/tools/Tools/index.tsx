import { useState } from 'react';
import { ScrollReveal } from '../../../components/ui/ScrollReveal';
import { Sculpture } from '../../home/Exhibition/Sculpture';
import { api } from '../../../services/api';
import { localTools, toolboxHref, type LocalTool } from '../../../services/toolCatalog';
import { transformTools } from '../../../utils/transformData';
import { useApiFetch } from '../../../hooks/useApiFetch';
import styles from './Tools.module.css';

const categories: {id: LocalTool['category']; label: string; note: string}[] = [
  {id: 'data', label: '代码与文字', note: '让想法，清晰一点。'},
  {id: 'files', label: '图像与文件', note: '把繁琐，交给工具。'},
  {id: 'daily', label: '日常小事', note: '留出时间，去做喜欢的事。'},
];
const glyphs: Record<string,string> = {'json-formatter':'{ }','markdown-html':'M↓','image-compressor':'▧','pdf-merger':'⊕','pdf-splitter':'⊘','image-to-pdf':'▤','csv-json':'⇄','base64':'64','qrcode':'⌗','word-counter':'Aa','timestamp':'◷'};

export function Tools() {
  const [category, setCategory] = useState<LocalTool['category']>('data');
  const [hovered, setHovered] = useState(0);
  const { data: tools, loading, error, refetch } = useApiFetch(() => api.getTools().then(transformTools));
  const selectedCategory = categories.find(item => item.id === category)!;
  const visibleTools = localTools.filter(tool => tool.category === category);
  const recommendations = tools.filter(tool => tool.link && tool.link !== '#' && !localTools.some(local => local.href === tool.link));
  return <section id="tools" className={styles.section} aria-labelledby="tools-title">
    <div className="container">
      <ScrollReveal><div className="section-header"><div><p className="section-subtitle">03 / THE COSMIC ATELIER</p><h2 id="tools-title" className="section-title serif">实用工具集</h2></div><p className="section-note"><span>MAKE SOMETHING USEFUL</span>把灵感，变成一些有用的东西。</p></div></ScrollReveal>
      <ScrollReveal><div className={styles.atelier}>
        <div className={styles.directory}>
          <div className={styles.directoryTop}><span>你的随身工作台</span><a href={toolboxHref} aria-label={`打开工具箱，${localTools.length} 个实用小工具`}>全部 {localTools.length} 个工具 <span aria-hidden="true">↗</span></a></div>
          <div className={styles.categories} role="group" aria-label="工具分类">
            {categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => {setCategory(item.id);setHovered(0);}}>{item.label}<span>{String(localTools.filter(tool=>tool.category===item.id).length).padStart(2,'0')}</span></button>)}
          </div>
          <div className={styles.toolList} key={category} aria-label={selectedCategory.label} data-motion-entry>
            {visibleTools.map((tool,index) => <a href={tool.href} key={tool.id} className={styles.tool} onPointerEnter={()=>setHovered(index)} onFocus={()=>setHovered(index)}>
              <span className={styles.glyph} aria-hidden="true">{glyphs[tool.id]}</span><span className={styles.toolCopy}><strong>{tool.title}</strong><span>{tool.description}</span></span><span className={styles.arrow} aria-hidden="true">↗</span>
            </a>)}
          </div>
          <p className={styles.privacy}><span aria-hidden="true">◈</span> 在你的浏览器里处理，给日常留一点余地。</p>
        </div>
        <div className={styles.visual}>
          <img className={styles.painting} src="/images/cosmic-sunflower.webp" width="1586" height="992" alt="" loading="lazy" decoding="async" />
          <Sculpture variant="tools" activeIndex={categories.findIndex(item=>item.id===category) * 3 + hovered} />
          <div className={styles.artistNote}><span>SUNFLOWER / A STUDY IN MOTION</span><h3 key={category} data-motion-entry>{selectedCategory.note}</h3><p>每一个小工具，都是让生活轻一点的尝试。</p></div>
        </div>
      </div></ScrollReveal>
      {recommendations.length > 0 && <div className={styles.recommendations}><p>更多工具推荐</p>{recommendations.map(tool=><a href={tool.link} key={tool.id}>{tool.title}<span aria-hidden="true">↗</span></a>)}</div>}
      {error && !loading && <p className={styles.notice}>更多工具推荐暂时无法加载，以上工具仍可使用。<button onClick={refetch}>重试</button></p>}
    </div>
  </section>;
}
