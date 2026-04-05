**[English](README.md)** | **[中文](README_zh.md)**

---

# /tools — Claude Code 工具箱 Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

扫描 Claude Code 环境，显示所有可用工具的概览：MCP 服务器、技能、智能体、插件、钩子等。

**用法**：`/tools`（读缓存，秒出）| `/tools --update`（全量扫描，刷新缓存）

> 默认输出语言：**中文**。`--update` 时自动翻译所有英文描述。

---

## 功能特点

- **双模式**：即时缓存读取（默认）或全量扫描（`--update`）
- **自动翻译**：英文描述自动翻译为中文并写入缓存
- **首次安全**：无缓存时 `/tools` 自动触发全量扫描
- **项目感知**：显示项目级差异（禁用的 MCP、插件覆盖、本地钩子）
- **缓存系统**：每次调用跳过扫描；缓存超过 7 天会提醒
- **跨平台**：支持 Windows、macOS、Linux
- **零配置**：开箱即用，缺失组件自动跳过

## 环境要求

- [Claude Code](https://claude.ai/code) CLI（建议最新版）
- Node.js >= 18（仅 `--update` 扫描时需要）

## 安装

```bash
mkdir -p ~/.claude/skills/tools
cp SKILL.md scan.js ~/.claude/skills/tools/
```

直接运行 `/tools`，首次无缓存时会自动全量扫描。

## 使用方法

| 命令 | 说明 |
|------|------|
| `/tools` | 显示缓存概览（秒出）。无缓存时自动扫描。 |
| `/tools --update` | 全量扫描，刷新缓存，自动翻译新增描述 |

## 输出示例

```
# 🔧 Claude Code 工具箱

📁 my-project

> 更新：2026-04-05 · GSD v1.30.0 · 6 技能 · 4 MCP · 25 智能体 · 57 GSD 命令 · 9 插件 · 5 钩子

## 🌐 MCP 服务器
| 名称 | 用途 | 连接详情 | 状态 |
|------|------|----------|------|
| context7 | Context7 文档上下文查询服务 | npx | ✅ |

## ⚡ 技能
| 技能 | 用途 |
|------|------|
| /tools | 查看当前环境中所有可用的 Claude Code 工具 |

---
`/tools --update` 刷新缓存 · `/update-config` 管理插件和钩子
```

## 项目结构

```
claude-tools-skill/
├── SKILL.md              # Skill 定义（prompt + 逻辑规则）
├── scan.js               # Node.js 扫描脚本（生成缓存文件）
├── README.md             # 英文文档
├── README_zh.md          # 中文文档（本文件）
├── CONTRIBUTING.md       # 贡献指南
├── LICENSE               # MIT 开源许可
├── package.json          # 项目元数据
└── .gitignore            # 排除运行时缓存文件
```

## 工作原理

**默认模式**：并行读取 `~/.claude/tools-cache.md` + `~/.claude/tools-project-cache.json`，应用项目级差异，即时输出。

**`--update` 模式**：运行 `scan.js` 读取所有 Claude 配置文件，构建缓存，然后 Claude 翻译未翻译的描述并写回，最后展示输出。

## 自动翻译机制

新增 skill/MCP/插件后运行 `/tools --update`：

1. 扫描脚本收集所有描述
2. 已知工具通过内置 CN 字典翻译
3. Claude 检查剩余描述 — 英文内容立即翻译
4. 翻译结果写回 `~/.claude/tools-cache.md` 持久化

无需手动添加翻译。

## 贡献

详见 [CONTRIBUTING.md](CONTRIBUTING.md)，了解如何报告问题、添加翻译和提交代码。

## 开源许可

[MIT](LICENSE) © 2026 XYL333FYQ
