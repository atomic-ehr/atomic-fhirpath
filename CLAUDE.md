---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

## Project Structure


* Use: bun mcp and lsp mcp
* Use context7 mcp to get docs about libraries
* Use bun mcp test tool or `bun test` to run tests
* Use ./tmp folder for temporal files and scripts
* Use ./refs/FHIRPath as official FHIRPath specification
* Use ./docs for project documentation. Use this for any project related documentation.
* Use ./scripts folder to write typescript scripts and run with bun
* All tests are in ./test folder
* ./antlr - antlr implementation to compare performance of main library (do not change it unless user asks for it)


## Use Bun instead of Node.js

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing


```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```