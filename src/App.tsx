import React from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Essays } from './components/Essays';
import { Tutorials } from './components/Tutorials';
import { Tools } from './components/Tools';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="app">
      {/* 背景光晕 */}
      <div className="ambientGlow"></div>

      {/* 导航栏 */}
      <Navbar />

      {/* 主内容 */}
      <main>
        <Hero />
        <Essays />
        <Tutorials />
        <Tools />
      </main>

      {/* 页脚 */}
      <Footer />
    </div>
  );
}

export default App;
