# 目录结构与章节绑定

> 树是文件系统的复写，以仓库实际为准；模块职责与章节绑定在此维护。

```text
harness-2048/
├── CLAUDE.md                       ← 工程约定入口
├── version-lock.json               ← 版本钉死 SSOT
├── src/
│   ├── main.tsx                    ← 挂载入口
│   ├── App.tsx                     ← 页面壳（4×4 棋盘骨架，逻辑随章节灌）
│   ├── index.css                   ← Tailwind 4 入口
│   └── lib/
│       ├── board.ts                ← 纯逻辑：棋盘/瓦片派生（骨架含空板）
│       └── board.test.ts           ← vitest 断言
├── docs/conventions/               ← structure / tagging
└── _work/                          ← 过程件（gitignore）
```

## 章节绑定表

| 章节 | 落点 | 交付物 |
|---|---|---|
| ch7 2048 游戏 | `src/` | 规则契约文件+边界断言+悔棋功能 |
| ch18 打包上线 | 构建配置 | H5 打包链+兼容性自检报告 |
| ch19 广告 SDK | `src/` | 广告位预留+上报埋点+本地存储 |
| ch21 线上 bug 修复 | `src/`+`_work/` | 版本迭代链路+线上回放修复 |
