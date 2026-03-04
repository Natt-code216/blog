# 📦 组件详细说明

本文档将详细说明项目中的各个组件。

## 目录

- [Navbar - 导航栏](#navbar---导航栏)
- [Hero - 首页](#hero---首页)
- [Essays - 随笔](#essays---随笔)
- [Tutorials - 教程](#tutorials---教程)
- [Tools - 工具集](#tools---工具集)
- [Footer - 页脚](#footer---页脚)
- [ScrollReveal - 滚动动画](#scrollreveal---滚动动画)

---

## Navbar - 导航栏

**位置**: `src/components/Navbar/`

**功能**: 顶部固定导航栏，支持滚动高亮和响应式

**Props**: 无

**状态**:
- 使用 `useScrollSpy` hook 跟踪滚动位置
- 根据滚动高度调整透明度

**样式**:
- 固定定位，高度 80px
- 背景: 透明 → 半透明渐变
- 支持深色主题

---

## Hero - 首页

**位置**: `src/components/Hero/`

**功能**: 首页展示区域，包含个人简介和导航入口

**Props**: 无

**内容**:
- 个人头像
- 姓名和简介
- 社交链接

**样式**:
- 全屏高度
- 垂直居中
- 响应式布局

---

## Essays - 随笔

**位置**: `src/components/Essays/`

**功能**: 展示随笔文章卡片网格

**Props**:
- `data: Essay[]` - 随笔数据数组

**数据结构**:
```typescript
interface Essay {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readTime: string;
  // ... 其他字段
}
```

**布局**:
- 3列网格 (桌面端)
- 响应式调整列数
- 卡片悬停效果

---

## Tutorials - 教程

**位置**: `src/components/Tutorials/`

**功能**: 展示教程列表

**Props**:
- `data: Tutorial[]` - 教程数据数组

**数据结构**:
```typescript
interface Tutorial {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  // ... 其他字段
}
```

**布局**:
- 列表视图
- 分类筛选 (待实现)
- 难度标记

---

## Tools - 工具集

**位置**: `src/components/Tools/`

**功能**: 展示实用工具卡片网格

**Props**:
- `data: Tool[]` - 工具数据数组

**数据结构**:
```typescript
interface Tool {
  id: number;
  name: string;
  description: string;
  category: string;
  link: string;
  // ... 其他字段
}
```

**布局**:
- 玻璃态卡片
- 2-3列网格
- 点击跳转外部链接

---

## Footer - 页脚

**位置**: `src/components/Footer/`

**功能**: 页脚信息展示

**Props**: 无

**内容**:
- 版权信息
- 社交链接
- 友情链接 (可选)

**样式**:
- 固定底部
- 浅色文字
- 响应式布局

---

## ScrollReveal - 滚动动画

**位置**: `src/components/ScrollReveal/`

**功能**: 包装组件，提供滚动揭示动画效果

**Props**:
- `children: ReactNode` - 子组件
- `delay?: number` - 延迟时间 (ms)

**动画效果**:
- 从下到上淡入
- 使用 `useIntersectionObserver` hook
- 支持自定义延迟

**使用示例**:
```tsx
<ScrollReveal delay={100}>
  <Essays data={essays} />
</ScrollReveal>
```

---

## Hooks

### useScrollSpy

**位置**: `src/hooks/useScrollSpy.ts`

**功能**: 监听滚动位置，控制导航高亮

**返回值**:
```typescript
{
  activeSection: string; // 当前激活的导航项
}
```

### useIntersectionObserver

**位置**: `src/hooks/useIntersectionObserver.ts`

**功能**: 实现滚动揭示动画

**参数**:
```typescript
(
  threshold?: number,  // 触发阈值
  rootMargin?: string  // 根边距
) => [ref, isIntersecting]
```

---

## 待完善

- [ ] 组件 Props 类型文档
- [ ] 组件使用示例代码
- [ ] 组件样式说明
- [ ] 组件交互逻辑说明

---

**© 2026 组件文档**
