# harness-2048 — 仓库工作约定（供 Claude Code）

本仓为书《Harness 工程：Codex 智能游戏开发入门》（xr-know-022）配套仓，
是书稿代码块的 **source of truth**。绑定章节：ch7（2048 游戏）、ch18（打包上线）、ch19（广告 SDK 接入）、ch21（线上 bug 修复）。

## 项目定位

可上架 H5 小游戏 2048——本书创业落地篇的旗舰载体：ch7 用规则契约+边界断言落核心玩法，ch18 打包 H5，ch19 广告位预留+上报埋点+本地存储，ch21 版本迭代+线上回放修复。

## 铁律

- **版本钉死**：依赖与 `version-lock.json` 的 `version_lock` 一致；不引入 lock 外的库；npm 一律走 `registry.npmmirror.com`
- **TDD**：`src/lib/` 游戏逻辑（滑动合并/边界判定/计分/存档校验）先写失败测试 → 确认失败 → 实现 → 确认绿 → commit；`npm test` 无 Key、无网全绿
- **只增不改**：随章节扩仓时不动现有模块签名/行为；新模块独立测试
- **零伪代码**：禁止 `TODO`/`...` 占位，每段代码必须可运行
- **契约先行**：滑动/合并规则先写成可测的规则契约文件，UI 只消费纯逻辑

## 验收

```bash
npm install --registry=https://registry.npmmirror.com
npm run build    # tsc strict + vite 构建门
npm test         # vitest 断言门（核心逻辑 100% 断言覆盖）
```

## 正式区 / 临时区（2026-10-24 人定，全产品线通用）

- 过程件（调参记录、回放样本、调试日志）进 `_work/`，不与正式件混放
- 正式区同名正式件有且仅有一个；`_work/` 整目录 .gitignore

## 细则（docs/conventions/，按需引用）

- 目录结构与章节绑定 → `docs/conventions/structure.md`
- Tag 规约：Release 格式 `v<MAJOR>.<MINOR>.<PATCH>-<YYYYMMDD>`，禁止删/覆盖，禁止 `git push --tags` → `docs/conventions/tagging.md`
