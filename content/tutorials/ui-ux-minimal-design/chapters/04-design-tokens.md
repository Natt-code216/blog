---
order: 4
title: 组件令牌化
est_read_minutes: 13
---

# 组件令牌化

前三章我们建立了字号、灰阶、间距三套阶梯。它们都是"设计决定"，但要让它们在代码里被实际使用，需要一个统一的桥梁——**设计令牌（design tokens）**。

本章讲什么是 design tokens、怎么组织它、怎么和 Figma / 代码两端同步。

## 什么是 design token

最朴素的定义：**design token 是一份命名的设计决定**。

例如：
- "主色是 #4A90E2" → token name: `--color-primary-500`, value: `#4A90E2`
- "卡片间距是 24px" → token name: `--space-card-gap`, value: `24px`
- "标题字号是 28px" → token name: `--fs-heading-lg`, value: `28px`

注意"命名"这件事的重要性。`#4A90E2` 是一个值；`--color-primary-500` 是一个**承诺**——它承诺"这是主色 500 级"，未来无论这个值变成 #5099EE 还是 #3D7FCB，引用它的所有代码都不需要改。

这是 token 化最大的好处：**把"决定"和"用法"解耦**。

## 三层令牌结构

成熟的 token 系统通常分三层：

1. **基础层（primitive）**：原始值，无业务含义。如 `--blue-500: #4A90E2`、`--gray-700: #404040`。
2. **语义层（semantic）**：业务命名，引用基础层。如 `--color-primary: var(--blue-500)`、`--color-text: var(--gray-700)`。
3. **组件层（component）**：组件级覆盖，引用语义层。如 `--button-bg: var(--color-primary)`、`--card-border: var(--color-border-light)`。

```css
:root {
  /* 1. primitive */
  --blue-500: #4A90E2;
  --gray-50:  #fafafa;
  --gray-700: #404040;
  --gray-900: #171717;

  /* 2. semantic */
  --color-primary:        var(--blue-500);
  --color-text:           var(--gray-900);
  --color-text-secondary: var(--gray-700);
  --color-bg:             var(--gray-50);
  --color-border:         var(--gray-700);

  /* 3. component */
  --button-bg:        var(--color-primary);
  --button-text:      #fff;
  --card-bg:          var(--color-bg);
  --card-border:      var(--color-border);
  --link-color:       var(--color-primary);
}
```

这三层结构看起来啰嗦，但每一层都有不可替代的价值：

- **基础层**用来切换主题——比如品牌色从蓝色改成绿色，只需要改 primitive；
- **语义层**用来切换暗色 / 浅色——同一个 `--color-text` 在不同模式下指向不同的灰阶；
- **组件层**用来覆盖单个组件——比如"危险按钮"想要单独的红色，只需要在 `.danger-button` 里覆盖 `--button-bg`。

## 切换主题：一行代码

有了三层结构之后，主题切换的代码极其朴素：

```css
:root {
  --color-text: var(--gray-900);
  --color-bg:   var(--gray-50);
}

[data-theme="dark"] {
  --color-text: var(--gray-50);
  --color-bg:   var(--gray-950);
}
```

任何使用 `var(--color-text)` 的组件，都不需要知道当前是哪种主题。它只引用语义层。主题切换只发生在语义层这一层。

这就是分层的回报——所有具体组件都活在变化之外。

## Figma 与代码的同步

Token 真正的价值在于"设计稿和代码用同一组名字"。

具体做法：

1. 设计师在 Figma 里建立 styles / variables，命名对齐到 token；
2. 开发者从 Figma 里导出 token 为 JSON（用 Figma Variables 或第三方插件）；
3. 用 Style Dictionary、Theo 等工具把 JSON 转成各平台的代码（Web 的 CSS 变量、iOS 的 swift、Android 的 xml）。

```js
// build-tokens.config.js（Style Dictionary）
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [{ destination: 'tokens.css', format: 'css/variables' }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'src/styles/',
      files: [{ destination: 'tokens.js', format: 'javascript/es6' }],
    },
  },
};
```

设计师改了一个间距值，运行一次 build，所有代码端自动同步。这是 token 化的最终形态。

## 不应该 token 化的东西

不是所有视觉决定都值得 token 化。下面这些不要 token：

- **业务相关的颜色**（如"VIP 标签 = 金色"）→ 这种是业务概念，应该放在业务代码里；
- **一次性的 hero 渐变**→ 用过一次的东西不要做成 token；
- **大量的灰阶变体**（如灰 423、灰 525）→ token 应该收敛到 10–12 阶，不要每个色阶都建。

经验法则：**一个 token 至少要在 3 处被使用，才值得建立**。

## 命名：很重要的小事

Token 命名是个反复被讨论的话题。我的偏好：

- **基础层用"颜色名 + 数字阶"**：`--blue-500`、`--gray-700`。原始可被使用，无业务暗示。
- **语义层用"用途名"**：`--color-text`、`--color-bg`、`--color-border-strong`。
- **组件层用"组件 + 部分"**：`--button-bg`、`--input-border-focus`。

避免：
- 业务暗示在基础层（如 `--brand-blue` → 当品牌色变了就尴尬）；
- 状态暗示在组件层（如 `--button-bg-hover` → 浪费一行命名空间）。

## 一个落地清单

如果你的项目要从零开始建立 token 系统，下面是一份可执行清单：

1. 选定字号、灰阶、间距三套阶梯，每套不超过 12 阶；
2. 把每套阶梯写成基础层 CSS 变量，放在 `:root`；
3. 建立语义层，覆盖 text / bg / border / link / primary / secondary / danger / success / warning / info；
4. 在 `[data-theme="dark"]` 下重写语义层；
5. 真正常用的组件（Button / Card / Input / Modal）按需再建组件层；
6. 用 Style Dictionary 把上面所有内容做成 JSON 源数据，CSS 由它生成；
7. 在 Figma 里把对应的 variables 建好，命名完全一致；
8. 定期（如季度）对一次"实际使用的颜色 vs 已定义的 token"，淘汰那些"被建立但没人用"的 token。

这套流程做下来，团队会有一份**可被多端共享、可被一行命令更新、可被工具校验**的视觉规范。这就是 token 化的目标。

## 本章小结

Design tokens 不是 CSS 变量的炫技形式，而是"把设计决定从分散记忆转移到可被工具管理"的桥梁。一旦三层结构（primitive / semantic / component）建立起来，主题切换、品牌色调整、跨平台同步都会变得近乎无痛。

下一章我们处理 token 化系统里最容易翻车的一个场景：**暗色主题**。我们会看到，为什么把白底黑字简单反色几乎一定会失败，以及一份成熟的暗色色板应该长什么样。

## 关于 token 的几个反模式

最后给一个 checklist，标出几种在 token 系统里反复出现的反模式：

1. **每个组件都建一组完整的 token**——只有真正被多次定制的组件值得建组件层 token。一次性使用的样式直接用语义层就够了。
2. **token 名称暴露实现细节**（如 `--color-blue-rgb`）——token 命名应该表达"做什么"，不是"长什么样"。
3. **token 被组件代码动态拼接生成**（如 `var(--button-${variant}-bg)`）——这种"动态 token"会让样式失去可追溯性，调试时极其痛苦。
4. **设计师和开发者用两套不同的命名**——这是最常见的失败原因。token 系统的全部价值就在于双方说同一种话。

一份健康的 token 系统是简洁的、可被全员理解的、稳定演进的。任何让它"变厚"的提议都应该被警惕。
