import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './App.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { ThemeToggle } from './components/ThemeToggle';
import { SearchBar } from './components/SearchBar';
import { HomePage } from './pages/HomePage';
import { EssayDetail } from './pages/EssayDetail';
import { TutorialDetail } from './pages/TutorialDetail';

function App() {
  return (
    <div className="app">
      <Helmet>
        <title>我的空间 · 一个克制的个人博客</title>
        <meta name="description" content="React + Strapi 构建的极简深色个人博客，分享随笔、教程与工具。" />
      </Helmet>

      <ScrollToTop />

      {/* 背景光晕 */}
      <div className="ambientGlow"></div>

      {/* 导航栏 */}
      <Navbar />

      {/* 路由 */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/essays/:slug" element={<EssayDetail />} />
        <Route path="/tutorials/:slug" element={<TutorialDetail />} />
        <Route path="*" element={<HomePage />} />
      </Routes>

      {/* 浮动操作 */}
      <SearchBar />
      <ThemeToggle />

      {/* 页脚 */}
      <Footer />
    </div>
  );
}

export default App;
