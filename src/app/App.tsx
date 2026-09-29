import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import '../styles/global.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ScrollToTop } from './ScrollToTop';
import { SearchBar } from '../features/search/SearchBar';
import { HomePage } from '../pages/HomePage';
import { EssayDetail } from '../pages/EssayDetail';
import { TutorialDetail } from '../pages/TutorialDetail';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ToolboxRedirect } from '../features/tools/ToolboxRedirect';
import { CollectionPage } from '../pages/CollectionPage';

function App() {
  return (
    <div className="app">
      <Helmet>
        <title>我的空间 · 创造、思考与探索</title>
        <meta name="description" content="一个关于创造、思考与探索的个人空间，分享技术心得、思想随笔与实用工具。" />
      </Helmet>

      <ScrollToTop />

      <a className="skip-link" href="#main">跳到主要内容</a>

      {/* 导航栏 */}
      <Navbar />

      {/* 路由 */}
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/essays/:slug" element={<EssayDetail />} />
          <Route path="/tutorials/:slug" element={<TutorialDetail />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/mini-tools" element={<ToolboxRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* 浮动操作 */}
      <SearchBar />

      {/* 页脚 */}
      <Footer />
    </div>
  );
}

export default App;
