**[English](README.md)** | **[中文](README_zh.md)**

---

# /tools — Claude Code Toolbox Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

Scan your Claude Code environment and display all available tools: MCP servers, skills, agents, plugins, hooks, and more.

**Usage**: `/tools` (read cache, instant) | `/tools --update` (full rescan, rebuild cache)

> Default output language: **Chinese (中文)**. The skill auto-translates all descriptions on `--update`.

---

## Features

- **Two modes**: instant cache read (default) or full rescan (`--update`)
- **Auto-translate**: English descriptions are translated to Chinese and cached automatically
- **First-run safe**: if no cache exists, `/tools` automatically triggers a full scan
- **Project-aware**: shows per-project differences (disabled MCP, plugin overrides, local hooks)
- **Cache system**: skips re-scanning on every call; warns when cache is > 7 days old
- **Cross-platform**: works on Windows, macOS, and Linux
- **Zero config**: works out of the box, missing components are silently skipped

## Requirements

- [Claude Code](https://claude.ai/code) CLI (latest version recommended)
- Node.js >= 18 (required for `--update` scan only)

## Installation

```bash
mkdir -p ~/.claude/skills/tools
cp SKILL.md scan.js ~/.claude/skills/tools/
```

Then run `/tools` — it will detect no cache and automatically do a full scan on first use.

## Usage

| Command | Description |
|---------|-------------|
| `/tools` | Show cached overview (instant). Auto-scans if no cache found. |
| `/tools --update` | Full rescan, rebuild cache, auto-translate new descriptions |

## Output Example

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

## Project Structure

```
claude-tools-skill/
├── SKILL.md              # Skill definition (prompt + logic rules)
├── scan.js               # Node.js scanner (generates cache files)
├── README.md             # English documentation (this file)
├── README_zh.md          # 中文文档
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # MIT License
├── package.json          # Project metadata
└── .gitignore            # Excludes runtime cache files
```

## How It Works

**Default mode**: reads `~/.claude/tools-cache.md` + `~/.claude/tools-project-cache.json` in parallel, applies project-level diffs, outputs instantly.

**`--update` mode**: runs `scan.js` which reads all Claude config files, builds the cache, then Claude translates any untranslated descriptions and writes them back before displaying output.

## Auto-Translation

When you run `/tools --update` after adding a new skill, MCP server, or plugin:

1. The scan script collects all descriptions
2. Known tools are translated via a built-in CN dictionary
3. Claude checks every remaining description — any still in English is translated immediately
4. The translated text is written back to `~/.claude/tools-cache.md` so it persists

You never need to manually add translations.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues, adding translations, and submitting changes.

## License

[MIT](LICENSE) © 2026 XYL333FYQ
