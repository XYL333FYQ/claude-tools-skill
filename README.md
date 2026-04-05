# /tools — Claude Code Toolbox Overview

Scan your Claude Code environment and display all available tools: MCP servers, skills, agents, plugins, hooks, and more.

**Usage**: `/tools` (read cache, instant) · `/tools --update` (full rescan, rebuild cache)

> Default output language: **Chinese (中文)**. The skill auto-translates all descriptions on `--update`.

---

## Features

- **Two modes**: instant cache read (default) or full rescan (`--update`)
- **Auto-translate**: any English description found after `--update` is translated to Chinese and written back to cache automatically — no manual step needed
- **First-run safe**: if no cache exists, `/tools` automatically triggers a full scan
- **Project-aware**: shows per-project differences (disabled MCP, plugin overrides, local hooks)
- **Cache system**: skips re-scanning on every call; warns when cache is > 7 days old
- **Zero config**: works out of the box, missing components are silently skipped

## Requirements

- [Claude Code](https://claude.ai/code) CLI (latest version recommended)
- Node.js >= 18 (required for `--update` scan only)

## Installation

```bash
mkdir -p ~/.claude/skills/tools
cp SKILL.md ~/.claude/skills/tools/
```

Then run `/tools` — it will detect no cache and automatically do a full scan on first use.

## Usage

| Command | Description |
|---------|-------------|
| `/tools` | Show cached overview (instant). Auto-scans if no cache found. |
| `/tools --update` | Full rescan, rebuild cache, auto-translate new descriptions |

## What gets auto-translated

When you run `/tools --update` after adding a new skill, MCP server, or plugin:

1. The scan script collects all descriptions
2. Known tools are translated via a built-in CN dictionary
3. Claude checks every remaining description — any still in English is translated immediately
4. The translated text is written back to `~/.claude/tools-cache.md` so it persists

You never need to manually add translations.

## Output example

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

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | The skill itself — copy this to `~/.claude/skills/tools/` |
| `README.md` | This file |

Cache files are written to `~/.claude/` and should **not** be committed:

```gitignore
# .gitignore (add to repo root if publishing)
tools-cache.md
tools-project-cache.json
tmp-tools-scan.js
```

## How it works

**Default mode**: reads `~/.claude/tools-cache.md` + `~/.claude/tools-project-cache.json` in parallel, applies project-level diffs for the current directory, outputs instantly.

**`--update` mode**: writes and runs a temporary Node.js script that reads all Claude config files, builds the cache, then Claude translates any untranslated descriptions and writes them back before displaying output.

---

## 中文说明

扫描 Claude Code 环境，显示所有可用工具的概览：MCP 服务器、技能、智能体、插件、钩子等。

### 安装

```bash
mkdir -p ~/.claude/skills/tools
cp SKILL.md ~/.claude/skills/tools/
```

直接运行 `/tools`，首次无缓存时会自动全量扫描。

### 使用

| 命令 | 说明 |
|------|------|
| `/tools` | 显示缓存概览（秒出）。无缓存时自动扫描。 |
| `/tools --update` | 全量扫描，刷新缓存，自动翻译新增描述 |

### 自动翻译机制

新增 skill/MCP/插件后运行 `/tools --update`：内置 CN 字典翻译已知工具，剩余英文描述由 Claude 实时翻译并写回缓存，下次 `/tools` 直接读中文缓存，无需任何手动操作。
