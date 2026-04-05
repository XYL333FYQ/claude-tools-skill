# Contributing to Claude Tools Skill

Thank you for your interest in contributing!

## How to Contribute

### Report Issues

Open a [GitHub Issue](https://github.com/XYL333FYQ/claude-tools-skill/issues) with:

- Description of the problem or feature request
- Steps to reproduce (for bugs)
- Your environment (OS, Node.js version, Claude Code version)

### Add Translations

The translation dictionary lives in `scan.js` as the `CN` object. To add or update translations:

1. Find the relevant section (`CN.mcp`, `CN.skill`, `CN.plugin`, `CN.agent`, `CN.hook`)
2. Add a key-value pair: `"English description": "translated description"`
3. Submit a pull request

### Submit Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin my-feature`
5. Open a Pull Request

## Development

```bash
# Test the scanner
node scan.js

# Verify output is valid JSON
node scan.js | node -e "process.stdin.on('data',d=>{JSON.parse(d);console.log('OK')})"
```

## Guidelines

- Keep `scan.js` as a single self-contained file (no external dependencies)
- Maintain backward compatibility with Node.js >= 18
- Test on Windows, macOS, and Linux if possible
- Preserve the JSON output format — it's consumed by SKILL.md

