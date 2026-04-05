#!/usr/bin/env node

/**
 * scan.js — Claude Code Toolbox Scanner
 *
 * Scans the local Claude Code environment and generates:
 *   1. ~/.claude/tools-cache.md          — Global tool cache (markdown)
 *   2. ~/.claude/tools-project-cache.json — Per-project diff cache (JSON)
 *   3. stdout JSON                        — Structured data for display
 *
 * Usage: node ~/.claude/skills/tools/scan.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Helpers ────────────────────────────────────────────────────────────────

const HOME = os.homedir();

/** Load and parse a JSON file, return {} on any error */
function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return {};
  }
}

/** Translate a description string using a dictionary; skip if already CJK */
function translate(desc, dict) {
  if (!desc) return desc;
  if (/[\u4e00-\u9fff]/.test(desc)) return desc; // already Chinese
  for (const [key, val] of Object.entries(dict)) {
    if (desc === key || desc.startsWith(key)) return val;
  }
  return desc;
}

// ─── Load Configuration ─────────────────────────────────────────────────────

const claudeJson = loadJSON(path.join(HOME, '.claude.json'));
const settings = loadJSON(path.join(HOME, '.claude', 'settings.json'));
const pluginsJson = loadJSON(path.join(HOME, '.claude', 'plugins', 'installed_plugins.json'));

// GSD version
let gsdVersion = '';
try {
  gsdVersion = fs.readFileSync(path.join(HOME, '.claude', 'get-shit-done', 'VERSION'), 'utf-8').trim();
} catch (e) {}

// ─── Translation Dictionary ─────────────────────────────────────────────────

const CN = {
  mcp: {
    "MCP server for Context7": "Context7 文档上下文查询服务",
    "Official draw.io MCP server for LLMs - Open diagrams in draw.io editor": "draw.io 图表编辑器，支持创建和编辑流程图、架构图等",
    "Playwright Tools for MCP": "Playwright 浏览器自动化工具，支持网页操作和截图",
  },
  skill: {
    "NotebookLM Research Assistant Skill": "查询 Google NotebookLM 笔记本，获取基于文档的精准回答",
    "Toolbox Overview": "查看当前环境中所有可用的 Claude Code 工具，支持缓存刷新",
  },
  plugin: {
    "Tools to maintain and improve CLAUDE.md files": "维护和改进 CLAUDE.md 文件 — 审计质量、捕获会话学习、保持项目记忆最新",
    "Automated code review for pull requests": "使用多个专业智能体对 PR 进行自动化代码审查，基于置信度评分",
    "Streamline your git workflow": "简化 Git 工作流，提供提交、推送和创建 PR 的快捷命令",
    "Comprehensive feature development workflow": "全功能开发工作流，包含代码库探索、架构设计和质量审查的专业智能体",
    "Creates interactive HTML playgrounds": "创建交互式 HTML 实验场 — 自包含单文件探索器，支持可视化控件和实时预览",
    "Core skills library for Claude Code": "Claude Code 核心技能库：TDD、调试、协作模式和成熟技术",
    "Agent that simplifies and refines code": "简化和优化代码，提升清晰度、一致性和可维护性，同时保留原有功能",
    "Continuous self-referential AI loops": "持续自引用 AI 循环，实现交互式迭代开发",
    "UI/UX design intelligence": "UI/UX 设计智能助手，支持多种风格、配色、字体搭配，覆盖多个技术栈",
  },
  agent: {
    "backend-architect": "构建后端、Java Servlet/Spring Boot、数据库连接、服务端逻辑",
    "code-reviewer": "代码审查、检查 Bug、代码质量反馈",
    "database-designer": "数据库设计、建表、SQL 优化、MySQL",
    "frontend-developer": "构建网页、HTML/CSS/JS 前端开发、UI 设计",
    "game-designer": "游戏设计、游戏机制、游戏平衡、游戏概念",
    "git-teacher": "Git 版本控制教学与指导",
    "godot-gameplay-scripter": "Godot 游戏引擎、GDScript 编程",
  },
  hook: {
    "gsd-context-monitor.js": "监控 GSD 上下文使用量",
    "tool-tips-post.sh": "工具调用后提示信息",
    "gsd-prompt-guard.js": "GSD 提示守卫，防止误操作",
    "gsd-check-update.js": "检查 GSD 版本更新",
    "auto-project-settings.js": "自动应用项目级设置",
  },
};

// ─── Scan: Skills ───────────────────────────────────────────────────────────

function scanSkills() {
  const skillsDir = path.join(HOME, '.claude', 'skills');
  if (!fs.existsSync(skillsDir)) return [];

  return fs.readdirSync(skillsDir)
    .filter(name => {
      try {
        return fs.statSync(path.join(skillsDir, name)).isDirectory()
          && fs.existsSync(path.join(skillsDir, name, 'SKILL.md'));
      } catch (e) {
        return false;
      }
    })
    .map(name => {
      let desc = '';
      try {
        const content = fs.readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf-8');
        const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatter) {
          const descLine = frontmatter[1].split('\n').find(l => l.startsWith('description:'));
          if (descLine) {
            desc = descLine.replace(/^description:\s*['"]?/, '').replace(/['"]\s*$/, '').trim();
          }
        }
        if (!desc) {
          const h1 = content.split('\n').find(x => x.startsWith('#'));
          if (h1) {
            desc = h1.replace(/^#+\s*/, '').replace(/^\/\S+\s+[—-]\s*/, '').trim();
          }
        }
      } catch (e) {}
      return { name, desc };
    });
}

// ─── Scan: Agents ───────────────────────────────────────────────────────────

function scanAgents() {
  const agentsDir = path.join(HOME, '.claude', 'agents');
  if (!fs.existsSync(agentsDir)) return [];
  return fs.readdirSync(agentsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.slice(0, -3));
}

// ─── Scan: GSD Commands ─────────────────────────────────────────────────────

function scanGSDCommands() {
  const gsdDir = path.join(HOME, '.claude', 'commands', 'gsd');
  if (!fs.existsSync(gsdDir)) return 0;
  return fs.readdirSync(gsdDir).filter(f => f.endsWith('.md')).length;
}

// ─── Scan: MCP Servers ──────────────────────────────────────────────────────

function scanMCPServers() {
  return Object.entries(claudeJson.mcpServers || {}).map(([name, config]) => {
    let connection = '';
    let desc = '';

    // MySQL MCP
    if (config.env && config.env.MYSQL_HOST) {
      connection = config.env.MYSQL_HOST + ':' + (config.env.MYSQL_PORT || '') + '/' + config.env.MYSQL_DATABASE;
      desc = 'MySQL 数据库（' + config.env.MYSQL_DATABASE + '）';
    } else if (config.args) {
      // npx-based MCP
      const browserIdx = config.args.indexOf('--browser');
      connection = browserIdx >= 0
        ? 'npx (' + config.args[browserIdx + 1] + ')'
        : 'npx';

      const pkgArg = (config.args || []).find(a => a.startsWith('@'));
      if (pkgArg) {
        const pkgName = pkgArg.replace(/@latest$/, '');
        desc = resolveNpxPackageDescription(pkgName);
      }
    } else {
      connection = config.command || '';
    }

    return { n: name, cn: connection, desc };
  });
}

/** Resolve package description from npx cache (cross-platform) */
function resolveNpxPackageDescription(pkgName) {
  // Windows: %LOCALAPPDATA%\npm-cache\_npx
  // macOS/Linux: ~/.cache/npm/_npx or ~/.npm/_npx
  const npxBases = [
    path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx'),
    path.join(HOME, '.cache', 'npm', '_npx'),
    path.join(HOME, '.npm', '_npx'),
  ];

  for (const npxBase of npxBases) {
    try {
      const dirs = fs.readdirSync(npxBase);
      for (const d of dirs) {
        const pkgJsonPath = path.join(npxBase, d, 'node_modules', pkgName, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          return JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')).description || '';
        }
      }
    } catch (e) {}
  }
  return '';
}

// ─── Scan: Plugins ──────────────────────────────────────────────────────────

function scanPlugins() {
  const enabledPlugins = settings.enabledPlugins;
  return Object.entries(pluginsJson.plugins || {}).map(([key, val]) => {
    const name = key.split('@')[0];
    const installPath = val[0].installPath;
    let desc = '';
    try {
      desc = JSON.parse(
        fs.readFileSync(path.join(installPath, '.claude-plugin', 'plugin.json'), 'utf-8')
      ).description || '';
    } catch (e) {}
    return {
      nm: name,
      desc,
      en: enabledPlugins && enabledPlugins.hasOwnProperty(key) ? enabledPlugins[key] === true : true,
      k: key,
    };
  });
}

// ─── Scan: Hooks ────────────────────────────────────────────────────────────

function scanHooks(hooksConfig) {
  const hooks = [];
  Object.entries(hooksConfig || {}).forEach(([event, groups]) => {
    groups.forEach(group => {
      (group.hooks || []).forEach(hook => {
        const cmd = hook.command || '';
        const name = cmd.split('/').pop().split(path.sep).pop().replace(/['"]/g, '');
        hooks.push({ n: name, e: event });
      });
    });
  });
  return hooks;
}

// ─── Scan: Recently Used ────────────────────────────────────────────────────

function scanRecentlyUsed() {
  const usage = claudeJson.skillUsage || {};
  const skillNames = skills.map(s => s.name);
  return Object.entries(usage)
    .filter(([k]) => skillNames.includes(k) || k.startsWith('gsd:') || k === 'tools' || k === 'update-config')
    .sort((a, b) => (b[1].lastUsedAt || 0) - (a[1].lastUsedAt || 0))
    .slice(0, 5)
    .map(([key, val]) => {
      const d = new Date(val.lastUsedAt);
      return { n: key, d: String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') };
    });
}

// ─── Scan: Project-level Data ───────────────────────────────────────────────

function scanProjectData() {
  const cwd = process.cwd();
  const cwdKey = cwd.split(path.sep).join('/');
  const homeKey = HOME.split(path.sep).join('/');

  // Project settings
  const projectSettings = loadJSON(path.join(cwd, '.claude', 'settings.json'));
  const mcpJson = loadJSON(path.join(cwd, '.mcp.json'));

  // Find project entry in .claude.json
  let projectEntry = null;
  for (const [key, val] of Object.entries(claudeJson.projects || {})) {
    if (key.split(String.fromCharCode(92)).join('/') === cwdKey) {
      projectEntry = val;
      break;
    }
  }

  // Project hooks
  const projectHooks = [];
  Object.entries(projectSettings.hooks || {}).forEach(([event, groups]) => {
    groups.forEach(group => {
      (group.hooks || []).forEach(hook => {
        const cmd = hook.command || '';
        projectHooks.push({
          n: cmd.split('/').pop().split(path.sep).pop(),
          e: event,
        });
      });
    });
  });

  return {
    dir: path.basename(cwd),
    nm: path.basename(cwd),
    isH: cwdKey === homeKey,
    dm: projectEntry ? projectEntry.disabledMcpServers || [] : [],
    em: projectEntry && projectEntry.mcpServers ? Object.keys(projectEntry.mcpServers) : [],
    ej: mcpJson.mcpServers ? Object.keys(mcpJson.mcpServers) : [],
    po: projectSettings.enabledPlugins || {},
    hk: projectHooks,
    hc: fs.existsSync(path.join(cwd, 'CLAUDE.md')),
    hm: fs.existsSync(path.join(cwd, '.mcp.json')),
    pc: fs.existsSync(path.join(cwd, '.claude', 'commands'))
      ? fs.readdirSync(path.join(cwd, '.claude', 'commands')).filter(f => f.endsWith('.md'))
      : [],
    pa: fs.existsSync(path.join(cwd, '.claude', 'agents'))
      ? fs.readdirSync(path.join(cwd, '.claude', 'agents')).filter(f => f.endsWith('.md'))
      : [],
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

// Run all scans
const skills = scanSkills();
const agents = scanAgents();
const gsdCommandCount = scanGSDCommands();
const mcpServers = scanMCPServers();
const plugins = scanPlugins();
const globalHooks = scanHooks(settings.hooks);
const recentlyUsed = scanRecentlyUsed();
const projectData = scanProjectData();

const today = (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date());

// ─── Build Markdown Cache ───────────────────────────────────────────────────

const lines = [];
lines.push('# 全局工具');
lines.push('');
lines.push('> 更新：' + today
  + (gsdVersion ? ' · GSD ' + gsdVersion : '')
  + ' · ' + skills.length + ' 技能'
  + ' · ' + mcpServers.length + ' MCP'
  + ' · ' + agents.length + ' 智能体'
  + (gsdCommandCount ? ' · ' + gsdCommandCount + ' GSD 命令' : '')
  + ' · ' + plugins.length + ' 插件'
  + ' · ' + globalHooks.length + ' 钩子');
lines.push('');

// MCP Servers table
lines.push('## 🌐 MCP 服务器');
lines.push('');
lines.push('| 名称 | 用途 | 连接详情 | 状态 |');
lines.push('|------|------|----------|------|');
mcpServers.forEach(m => {
  lines.push('| ' + m.n + ' | ' + translate(m.desc || '', CN.mcp) + ' | ' + m.cn + ' | ✅ |');
});
lines.push('');

// Skills table
lines.push('## ⚡ 技能');
lines.push('');
lines.push('| 技能 | 用途 |');
lines.push('|------|------|');
skills.forEach(s => {
  lines.push('| /' + s.name + ' | ' + translate(s.desc, CN.skill) + ' |');
});
lines.push('');

// Agents section
const builtInAgents = agents.filter(a => !a.startsWith('gsd-'));
const gsdAgents = agents.filter(a => a.startsWith('gsd-')).map(a => a.slice(4));

lines.push('## 🤖 智能体');
lines.push('');
if (builtInAgents.length) {
  lines.push('**内置（' + builtInAgents.length + ' 个）：**');
  lines.push('');
  lines.push('| 名称 | 触发场景 |');
  lines.push('|------|----------|');
  builtInAgents.forEach(a => {
    lines.push('| ' + a + ' | ' + (CN.agent[a] || '—') + ' |');
  });
}
if (gsdAgents.length) {
  lines.push('');
  lines.push('**GSD 专用（' + gsdAgents.length + ' 个）：** ' + gsdAgents.join('、'));
  lines.push('> 由 /gsd:* 命令自动调用，无需手动触发');
}

// GSD Commands section
if (gsdCommandCount) {
  lines.push('');
  lines.push('## 🚀 GSD 命令（' + gsdCommandCount + ' 个）');
  lines.push('');
  lines.push('| 命令 | 用途 |');
  lines.push('|------|------|');
  lines.push('| /gsd:new-project | 初始化项目 |');
  lines.push('| /gsd:plan-phase N | 规划阶段 |');
  lines.push('| /gsd:execute-phase N | 执行阶段 |');
  lines.push('| /gsd:progress | 查看进度 |');
  lines.push('| /gsd:do 描述 | 智能路由 |');
  lines.push('| /gsd:help | 查看全部 ' + gsdCommandCount + ' 个命令 |');
}
lines.push('');

// Plugins table
lines.push('## 🧩 插件');
lines.push('');
lines.push('| 插件 | 用途 | 状态 |');
lines.push('|------|------|------|');
plugins.forEach(p => {
  const d = translate(p.desc, CN.plugin);
  lines.push('| ' + p.nm + ' | ' + (d.length > 60 ? d.slice(0, 57) + '...' : d) + ' | ' + (p.en ? '✅ 启用' : '❌ 禁用') + ' |');
});
lines.push('');

// Hooks table
lines.push('## 🪝 钩子（' + globalHooks.length + ' 个，自动运行）');
lines.push('');
lines.push('| 钩子 | 触发时机 | 作用 |');
lines.push('|------|----------|------|');
const hookEventLabels = { PreToolUse: '工具调用前', PostToolUse: '工具调用后', SessionStart: '会话启动' };
globalHooks.forEach(x => {
  lines.push('| ' + x.n + ' | ' + (hookEventLabels[x.e] || x.e) + ' | ' + (CN.hook[x.n] || '—') + ' |');
});
lines.push('');

// Status line
lines.push('## 📊 状态栏');
lines.push('');
lines.push(settings.statusLine ? '✅ 已启用' : '❌ 未启用');

// Recently used
if (recentlyUsed.length) {
  lines.push('');
  lines.push('## 🕐 最近使用');
  lines.push('');
  lines.push('| 工具 | 最后使用 |');
  lines.push('|------|----------|');
  recentlyUsed.forEach(r => {
    lines.push('| /' + r.n + ' | ' + r.d + ' |');
  });
}

// ─── Write Cache Files ──────────────────────────────────────────────────────

const cacheContent = lines.join('\n');
fs.writeFileSync(path.join(HOME, '.claude', 'tools-cache.md'), cacheContent, 'utf-8');

// Project cache
let projectCache = { _meta: { generatedAt: today }, projects: {} };
try {
  projectCache = JSON.parse(fs.readFileSync(path.join(HOME, '.claude', 'tools-project-cache.json'), 'utf-8'));
} catch (e) {}
projectCache._meta.generatedAt = today;
const cwd = process.cwd();
const cwdKey = cwd.split(path.sep).join('/');
projectCache.projects[cwdKey] = projectData;
fs.writeFileSync(path.join(HOME, '.claude', 'tools-project-cache.json'), JSON.stringify(projectCache), 'utf-8');

// ─── Output JSON to stdout ──────────────────────────────────────────────────

// Apply translations for display
mcpServers.forEach(m => { m.desc = translate(m.desc || '', CN.mcp); });
skills.forEach(s => { s.desc = translate(s.desc, CN.skill); });
plugins.forEach(p => { p.desc = translate(p.desc, CN.plugin); });

const output = {
  gv: gsdVersion,
  sk: skills,
  ag: agents,
  gc: gsdCommandCount,
  mc: mcpServers,
  pl: plugins,
  hk: globalHooks,
  sl: !!settings.statusLine,
  rc: recentlyUsed,
  pj: projectData,
  cwdKey,
  today,
};

process.stdout.write(JSON.stringify(output));
