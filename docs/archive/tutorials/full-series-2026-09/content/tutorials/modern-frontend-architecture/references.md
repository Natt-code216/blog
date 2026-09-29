# 参考资料 · 现代前端架构指南

- Patterns.dev — <https://www.patterns.dev/>（Lydia Hallie & Addy Osmani）
  - 核心观点：把"渲染模式 / 状态模式 / 性能模式"系统化为一组可对比的卡片，便于在不同场景做权衡。
- Kent C. Dodds, *Epic React* — <https://www.epicreact.dev/>
  - 核心观点：状态分层、组合优先于继承、把数据流和 UI 树解耦。
- Lee Robinson, "Vercel's Frontend Cloud" — <https://leerob.io/>
  - 核心观点：边缘渲染重新分配了"动态 / 静态"的边界，路由组织随之改变。
- React 官方文档 "Thinking in React" — <https://react.dev/learn/thinking-in-react>
  - 核心观点：先按数据流而非视觉切分组件。
- Vue 官方文档 "组件深入" — <https://cn.vuejs.org/guide/components/registration.html>
- Martin Fowler, "Micro Frontends" — <https://martinfowler.com/articles/micro-frontends.html>
  - 核心观点：模块联邦不是银弹，只在团队规模与发布节奏触发临界时才划算。
- Dan Abramov, "Before You memo()" — <https://overreacted.io/before-you-memo/>
  - 核心观点：很多渲染问题先用组合解决，再考虑 memo。
- Mark Erikson, *Redux Style Guide* — <https://redux.js.org/style-guide/>
  - 核心观点：把状态分为 server / ui / form 三类管理。
