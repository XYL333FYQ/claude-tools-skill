# /tools — Toolbox Overview

View all available Claude Code tools in your environment.

**Usage**: `/tools` (read cache) · `/tools --update` (full rescan)

---

<objective>
无参数→读缓存+项目缓存，秒出。--update→单次 bash 扫描全部配置+项目差异→写缓存→输出。
</objective>

<rules>
> ⚠️ No hallucination: all data must be read from actual files. Show "(not configured)" or 0 if missing.
> 🌐 Output language: match the user's conversation language. Translate tool descriptions accordingly. Keep tool names as-is.
> ⏱️ 最少工具调用原则：Mode A 0 次 Bash（纯 Read），Mode B 仅 1 次 Bash + 按需翻译缓存。

## 模式 A：读缓存（默认）— 0 次 Bash 调用

1. **并行读取**两个文件（2 次 Read 调用，无需授权）：
   - `~/.claude/tools-cache.md` → 全局工具缓存
   - `~/.claude/tools-project-cache.json` → 项目级差异缓存（可能不存在）
2. 若 `tools-cache.md` 不存在、内容残缺、或文件为空 → 自动切换模式 B（首次运行时会触发此路径）
3. **获取当前路径**：从系统环境信息（Primary working directory）直接提取，反斜杠转正斜杠得到 `cwdKey`。**禁止为此跑 Bash 命令。**
4. 头部标识：`cwdKey === homedir` → `🏠 主目录`；否则 → `📁 目录名（项目名）`
5. **项目级增强**（仅当不在主目录时）：
   - 从项目缓存 `projects[cwdKey]` 取出 `pj` 对象
   - 若存在 → 按下方"项目级差异展示规则"拆分表格列
   - 若不存在或无差异 → 显示全局缓存原样，末尾追加 `> 💡 在此目录运行 /tools --update 可生成项目级视图`
6. 缓存超过 7 天 → 追加 `> ⚠️ 缓存已过期（N 天），建议运行 /tools --update`
7. 末尾追加 footer

## 模式 B：全量扫描（--update）— 仅 1 次工具调用

**单步：Bash 执行永久扫描脚本**

```bash
node ~/.claude/skills/tools/scan.js
```

脚本功能（`~/.claude/skills/tools/scan.js` 是预存的永久文件，每次 --update 直接运行）：
- 读取所有全局+项目配置
- `fs.writeFileSync` 写两个缓存文件（不依赖 Write 工具）
- stdout 输出一行 JSON 供展示

**全局数据字段：**
- `gv` GSD 版本 · `sk` 技能数组(name,desc) · `ag` 智能体数组(name,desc) · `cmd` 命令命名空间数组(ns,count,cmds)
- `mc` MCP 数组(n,cn) · `pl` 插件数组(nm,desc,en,k) · `hk` 钩子数组(n,e)
- `sl` 状态栏(bool) · `rc` 最近使用数组(n,d) · `cwdKey` 当前路径（正斜杠）

**项目数据字段（pj）：**
- `dir` 目录名 · `nm` 项目名 · `isH` 是否主目录
- `dm` 禁用的 MCP · `em` 额外 MCP(项目) · `ej` 额外 MCP(.mcp.json)
- `po` 插件覆盖 · `hk` 项目钩子 · `hc` 有 CLAUDE.md · `hm` 有 .mcp.json
- `pc` 项目命令 · `pa` 项目智能体

**翻译（持久化到缓存）**：脚本内 CN 字典覆盖已知工具，但新加的插件/MCP/技能描述可能仍是英文。

解析 JSON 后**必须执行**：

1. 检测 `mc[].desc`、`sk[].desc`、`ag[].desc`、`pl[].desc` 中每一项是否与当前对话语言一致
2. **发现任何不匹配的描述 → 直接翻译为当前对话语言，不询问用户**
3. 若有翻译发生：Read `~/.claude/tools-cache.md`，用 Edit 替换对应行，确保缓存持久化
4. 展示时使用翻译后的版本

> 这样做是为了：新加插件/MCP 后立刻翻译并写入缓存，下次读缓存就是中文，不用每次输出时重新翻。

**输出**：解析 JSON 后按 output_format 格式化输出。

## 项目级差异展示规则

以下规则同时适用于模式 A（用项目缓存）和模式 B（用 pj 对象）。**仅在 `isH` 为 false 时应用。**

### MCP 表格
当有项目级差异时，改为 `| 名称 | 用途 | 连接详情 | 全局 | 本项目 |`：
- 出现在 `dm`(disabledMcpServers) → 本项目列：❌ 禁用
- `em`(extraMcpServers) 或 `ej`(extraMcpJsonServers) 中的额外 MCP → 追加到末尾，全局列标"—"，本项目列：✅ 启用
- 若无任何差异 → 保持原始四列

### 插件表格
当 `po`(pluginOverrides) 非空时，改为 `| 插件 | 用途 | 全局 | 本项目 |`：
- 在 `po` 中的 key → 本项目列直接显示实际状态：✅ 启用 或 ❌ 禁用
- 不在 `po` 中 → 本项目列：与全局相同
- 若 `po` 为空对象 → 保持原始三列

### 钩子表格
钩子是追加模式（全局始终运行，项目在基础上额外添加），始终拆分：
- 不在主目录时，始终使用 `| 钩子 | 触发时机 | 作用 | 全局 | 本项目 |`：
  - 全局钩子 → 全局列：✅，本项目列：✅（全局钩子不可按项目禁用，始终运行）
  - 项目独有钩子（不在全局中）→ 追加到末尾，全局列标"—"，本项目列：✅
- 在主目录时 → 保持原始三列

### 末尾追注
- 若有项目独有命令：`> 📂 项目命令（N 个）：cmd1.md、cmd2.md`
- 若有项目独有智能体：`> 🤖 项目智能体（N 个）：agent1、agent2`
- `> 📝 CLAUDE.md — ✅ 存在 / ❌ 不存在 · .mcp.json — ✅ 存在 / ❌ 不存在`
</rules>

<output_format>

## 界面规范

头部（每次都输出）：
```
# 🔧 Claude Code 工具箱

🏠 Home  or  📁 ss (project name)
```

Metadata line (copied from cache, prefixed with `>`):
```
> Updated: 2026-04-05 · GSD v1.30.0 · 6 skills · 4 MCP · 25 agents · 57 GSD commands · 9 plugins · 5 hooks
```

Section headings with icons — translate labels to match conversation language:
- `## 🌐 MCP Servers`
- `## ⚡ Skills`
- `## 🤖 Agents`
- `## 🚀 {NAMESPACE} Commands`（动态生成，按扫描到的命令命名空间）
- `## 🧩 Plugins`
- `## 🪝 Hooks`
- `## 📊 Status Line`
- `## 🕐 Recently Used`

**After --update, append:**
```
✅ Cache updated (YYYY-MM-DD)
```

footer (always at end):
```
---
`/tools --update` refresh cache · `/update-config` manage plugins and hooks
```

</output_format>
