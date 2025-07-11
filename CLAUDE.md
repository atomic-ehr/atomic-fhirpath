---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Follow this flow:
* there is ./tasks/ folder with tasks to be done
* Wait for user to set the task to work on; task will be a file in tasks folder
* You working only on one task in a time - read the task file description in folder, document plan and progress back into task file. When task is completed, set it to [completed] status in a title.
* Use ./docs as your memory bank - read current summary of project keep it up-to-date, when you are changing the project
* the key document in ./docs is ./docs/architecture.md - it is a summary of project architecture with links to all important files

## Documentation Structure

The documentation is organized to serve both as your memory system and as human-readable documentation:

```
docs/
├── architecture.md          # Key document - system overview and file locations
├── overview/               # High-level documentation
│   ├── fhirpath-support.md # Feature support matrix (what's implemented)
│   ├── performance.md      # Performance characteristics
│   └── roadmap.md         # Future plans
├── components/            # Component-specific docs
│   ├── parser.md         # Parser implementation
│   ├── compiler.md       # Compiler and type system
│   └── ...              # Other components
├── memory/              # AI assistant memory aids (when created)
│   ├── quick-reference.md # Common operations and patterns
│   └── code-locations.md  # Where to find implementations
└── guides/              # How-to guides (when created)
```

### How to use documentation:
1. **Start with architecture.md** - Contains project structure and links to all important files
2. **Check fhirpath-support.md** - See what features are already implemented
3. **Read component docs** - Detailed information about specific components
4. **Update docs when making changes** - Keep documentation in sync with code

* Use: bun mcp and lsp mcp
* Use ./docs folder as your memory bank - read project overview when needed, update it if you are making changes
* Use ast-grep to search for code, refactoring and linting in the project
* Use refs/FHIRPath/spec/2019May/index.adoc as source of fhirpath specification
* In case of conflict of tests or code with a spec - spec wins, and you have to fix tests or code!!!!
* Use bun mcp test tool or `bun test` to run tests
* Use ./tmp folder for temporal files and scripts
* Use ./scripts folder to write typescript scripts and run with bun
* All tests are in ./test folder
* When you create or modify typescript file - always check it with `bun tsc --noEmit <file>` and fix

## Bun MCP

- `mcp__bun__run-bun-script-file` - Execute JS/TS script files with Bun runtime
- `mcp__bun__run-bun-eval` - Execute JS/TS code directly with Bun
- `mcp__bun__run-bun-script` - Execute scripts from package.json
- `mcp__bun__run-bun-install` - Install dependencies (all or specific)
- `mcp__bun__run-bun-build` - Build and optimize projects (minify, sourcemaps, splitting)
- `mcp__bun__run-bun-test` - Run tests with Bun's test runner (coverage, watch)
- `mcp__bun__analyze-bun-performance` - Analyze bundle size, dependencies, runtime
- `mcp__bun__benchmark-bun-script` - Benchmark script performance

## Bun CLI

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun tsc --noEmit` todo typecheck
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.
