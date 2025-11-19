# Repository-specific Copilot Instructions

This project is a minimal static Node/JS workspace. Use these instructions to be immediately productive when editing, running, or extending this repo.

## Big picture
- **What:** tiny JavaScript repo with `1.js` (entry script) and an empty `1.html`.
- **Why:** appears to be a simple demo or starter project; there are no services, build steps, or CI configured.

## Key files
- `package.json`: project metadata. Contains a placeholder `test` script and `type: "commonjs"`.
- `1.js`: entry script — logs `Hello, GitHub Collaboration!`.
- `1.html`: present but empty; likely intended for quick browser demos.

## How to run & test locally
- Run the script with Node (PowerShell):

  `node 1.js`

- Open `1.html` in a browser for any static UI changes. There is no dev server configured.

## Project conventions and patterns
- Module format: this repo uses CommonJS (`type: "commonjs"` in `package.json`). When adding code, prefer `require()`/`module.exports` unless you change `type`.
- Keep changes minimal and focused: the repo currently has no dependencies, tests, or build tools. If adding libraries, update `package.json` and keep the install instructions clear.

## Developer workflows (what an agent should do)
- If you add code that needs running, include or update NPM scripts in `package.json` (e.g., `start`, `test`, `build`).
- If you introduce a build/dev tool (Webpack/Vite/ESBuild), add a `README.md` with exact commands and update `package.json` scripts.
- Do not assume CI is present — propose a minimal GitHub Actions workflow if requested.

## Examples specific to this repo
- To add a new utility module `lib/util.js` and use it from `1.js`:

  `// lib/util.js\n  module.exports = { greet: name => `Hello ${name}` }`\n
  `// 1.js\n  const { greet } = require('./lib/util')\n  console.log(greet('GitHub Collaboration'))`

- To add a test script, use a small test runner (e.g., Jest) and update `package.json`:

  `npm install --save-dev jest`\n  Update `package.json` scripts: `"test": "jest"`.

## Editing and commit guidance for AI agents
- Make atomic commits with a short prefix (e.g., `feat:`, `fix:`) and concise messages.
- When changing `package.json`, update `version` only when releasing; otherwise keep it unchanged.
- Avoid adding global configuration (editor/IDE) files without explicit request.

## Limitations and detection hints
- No tests or CI are present — verify behavior locally by running `node` or opening `1.html`.
- If you see `type: "module"` added later, switch to ESM imports/exports.

---

If any section is unclear or you want more detail (examples for tests, CI, or a suggested GitHub Actions workflow), tell me which area to expand. 
