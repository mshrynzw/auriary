/**
 * Workers 向けビルドのあいだだけ、Next の getMiddlewareManifest を null にする。
 * OpenNext のパッチが Next 16.4 のこの関数に当たらず、
 * 公開後に存在しない middleware-manifest.json を読もうとして 500 になる。
 * ビルドが終わったら元のファイルに戻す。next dev の挙動は変えない。
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const file = require.resolve('next/dist/server/next-server.js');
const original = fs.readFileSync(file, 'utf8');
const needle = `    getMiddlewareManifest() {
        if (this.minimalMode) {
            return null;
        } else {
            const manifest = require(this.middlewareManifestPath);
            return manifest;
        }
    }`;
const patched = `    getMiddlewareManifest() {
        return null;
    }`;

if (!original.includes(needle)) {
  console.error('next-server.js の getMiddlewareManifest が見つかりません');
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('使い方: with-workers-next-patch.mjs <command> [args...]');
  process.exit(1);
}

fs.writeFileSync(file, original.replace(needle, patched));
const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
fs.writeFileSync(file, original);
process.exit(result.status ?? 1);
