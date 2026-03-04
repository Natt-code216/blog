# 🎨 样式定制指南

本文档将指导您如何自定义项目的样式。

## 目录

- [全局样式](#全局样式)
- [颜色主题](#颜色主题)
- [字体配置](#字体配置)
- [布局调整](#布局调整)
- [动画效果](#动画效果)
- [响应式设计](#响应式设计)

---

## 全局样式

**文件**: `src/App.css`

### CSS 变量

在 `:root` 中定义的所有 CSS 变量:

```css
:root {
  /* 颜色 */
  --background: #050505;
  --text: #fcfcfc;
  --border: rgba(255, 255, 255, 0.08);
  --accent: #61dafb;

  /* 布局 */
  --max-width: 1200px;
  --navbar-height: 80px;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 4rem;

  /* 动画 */
  --transition: all 0.3s ease;
}
```

### 修改方法

直接编辑 `src/App.css` 文件，修改对应的变量值。

---

## 颜色主题

### 当前主题: 深色

```css
--background: #050505;     /* 背景 */
--text: #fcfcfc;           /* 文字 */
--border: rgba(255, 255, 255, 0.08);  /* 边框 */
--accent: #61dafb;         /* 强调色 */
```

### 切换到亮色主题

```css
:root {
  --background: #ffffff;
  --text: #1a1a1a;
  --border: rgba(0, 0, 0, 0.1);
  --accent: #61dafb;
}
```

---

## 字体配置

### 当前字体

```css
font-family: 'Inter', sans-serif;        /* 正文 */
font-family: 'Playfair Display', serif;  /* 标题 */
```

### 更改字体

1. 在 Google Fonts 选择新字体
2. 在 `index.html` 中添加字体链接
3. 在 `src/App.css` 中更新字体变量

**示例**:
```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

```css
/* src/App.css */
body {
  font-family: 'Roboto', sans-serif;
}
```

---

## 布局调整

### 最大宽度

**当前**: 1200px

修改位置: `src/App.css`
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
```

### 导航栏高度

**当前**: 80px

修改位置: `src/App.css`
```css
.navbar {
  height: 80px;
}
```

### 间距

CSS 变量中定义了不同级别的间距:

```css
--spacing-sm: 1rem;   /* 小间距 */
--spacing-md: 2rem;   /* 中间距 */
--spacing-lg: 4rem;   /* 大间距 */
```

---

## 动画效果

### 当前动画

1. **导航栏滚动透明度变化**
   - 文件: `src/components/Navbar/index.tsx`
   - 触发: 滚动

2. **滚动揭示动画**
   - 文件: `src/components/ScrollReveal/index.tsx`
   - 触发: 元素进入视口

3. **卡片/按钮悬停效果**
   - 文件: 各组件的 `.module.css`
   - 触发: 鼠标悬停

### 修改动画

调整 `src/App.css` 中的过渡变量:

```css
:root {
  --transition: all 0.3s ease;
}
```

---

## 响应式设计

### 断点

当前定义的断点:

```css
/* 移动端 */
@media (max-width: 768px) { }

/* 平板 */
@media (min-width: 768px) and (max-width: 1024px) { }

/* 桌面 */
@media (min-width: 1024px) { }
```

### 修改响应式

在对应的组件 `.module.css` 文件中添加媒体查询:

```css
.card {
  /* 默认样式 */

  @media (max-width: 768px) {
    /* 移动端样式 */
  }
}
```

---

## 待完善

- [ ] 添加更多主题示例
- [ ] 提供完整的样式覆盖指南
- [ ] 添加组件样式定制示例
- [ ] 添加动画效果库推荐

---

**© 2026 样式定制指南**
