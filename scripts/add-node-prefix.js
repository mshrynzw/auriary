#!/usr/bin/env node

/**
 * OpenNext が生成したコードに node: プレフィックスを追加するスクリプト
 * Cloudflare Workers の compatibility_date が 2024-09-23 以降の場合、
 * Node.js 組み込みモジュールには node: プレフィックスが必要です
 */

const fs = require('fs');
const path = require('path');

const openNextDir = path.join(process.cwd(), '.open-next');

// Node.js 組み込みモジュールのリスト
const nodeBuiltinModules = [
  'async_hooks',
  'fs',
  'path',
  'url',
  'vm',
  'buffer',
  'crypto',
  'stream',
  'util',
  'http',
  'https',
  'events',
  'os',
  'tty',
  'zlib',
  'dns',
  'net',
];

// Cloudflare Workers でサポートされていない Node.js 組み込みモジュール
// これらのモジュールは node: プレフィックスを追加しない（または削除する）
const unsupportedModules = ['timers', 'child_process', 'cluster', 'worker_threads'];

/**
 * ファイル内の require() 呼び出しに node: プレフィックスを追加
 * ただし、Cloudflare Workers でサポートされていないモジュールは除外
 */
function addNodePrefix(content) {
  let modified = content;

  // Cloudflare Workers でサポートされていないモジュールの node: プレフィックスを削除
  // node:timers を timers に戻す（Cloudflare Workers ではグローバル関数が利用可能）
  for (const module of unsupportedModules) {
    // require("node:module") を require("module") に戻す（ただし、これは通常使用されない）
    const pattern1 = new RegExp(`require\\(["']node:${module}["']\\)`, 'g');
    modified = modified.replace(pattern1, `require("${module}")`);

    const pattern2 = new RegExp(`require\\(['"]node:${module}['"]\\)`, 'g');
    modified = modified.replace(pattern2, `require('${module}')`);

    // さらに、require("module") を削除またはコメントアウト（Cloudflare Workers では不要）
    // ただし、これは危険なので、まずは node: プレフィックスを削除するだけにする
  }

  // require("module") を require("node:module") に置換
  for (const module of nodeBuiltinModules) {
    // require("module") パターン
    const pattern1 = new RegExp(`require\\(["']${module}["']\\)`, 'g');
    modified = modified.replace(pattern1, `require("node:${module}")`);

    // require('module') パターン
    const pattern2 = new RegExp(`require\\(['"]${module}['"]\\)`, 'g');
    modified = modified.replace(pattern2, `require("node:${module}")`);
  }

  // dns/promises の特別処理
  modified = modified.replace(/require\(["']dns\/promises["']\)/g, 'require("node:dns/promises")');
  modified = modified.replace(/require\(['"]dns\/promises['"]\)/g, 'require("node:dns/promises")');

  // timers の特別処理: node:timers を空のオブジェクトに置き換え
  // Cloudflare Workers では setTimeout/setInterval などのグローバル関数が利用可能なので、
  // timers モジュールは不要（空のオブジェクトで置き換え）
  modified = modified.replace(/require\(["']node:timers["']\)/g, '({}) /* timers not needed in Cloudflare Workers - global functions available */');
  modified = modified.replace(/require\(['"]node:timers['"]\)/g, "({}) /* timers not needed in Cloudflare Workers - global functions available */");
  modified = modified.replace(/require\(["']timers["']\)/g, '({}) /* timers not needed in Cloudflare Workers - global functions available */');
  modified = modified.replace(/require\(['"]timers['"]\)/g, "({}) /* timers not needed in Cloudflare Workers - global functions available */");

  return modified;
}

/**
 * ディレクトリ内のファイルを再帰的に処理
 */
function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // ディレクトリの場合は再帰的に処理
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.mjs') || entry.name.endsWith('.js'))) {
      // .mjs または .js ファイルを処理
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const modified = addNodePrefix(content);

        if (content !== modified) {
          fs.writeFileSync(fullPath, modified, 'utf8');
          console.log(`✅ Updated: ${path.relative(process.cwd(), fullPath)}`);
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not process ${fullPath}: ${error.message}`);
      }
    }
  }
}

if (!fs.existsSync(openNextDir)) {
  console.error('❌ Error: .open-next directory not found');
  console.error('   Please run "pnpm run build:cloudflare" first');
  process.exit(1);
}

console.log('🔧 Adding node: prefix to Node.js built-in modules...');

try {
  // server-functions ディレクトリを処理
  const serverFunctionsDir = path.join(openNextDir, 'server-functions');
  if (fs.existsSync(serverFunctionsDir)) {
    processDirectory(serverFunctionsDir);
  }

  // worker.js も処理
  const workerJs = path.join(openNextDir, 'worker.js');
  if (fs.existsSync(workerJs)) {
    const content = fs.readFileSync(workerJs, 'utf8');
    const modified = addNodePrefix(content);
    if (content !== modified) {
      fs.writeFileSync(workerJs, modified, 'utf8');
      console.log(`✅ Updated: .open-next/worker.js`);
    }
  }

  console.log('✨ Done adding node: prefix');
} catch (error) {
  console.error('❌ Error processing files:', error.message);
  process.exit(1);
}

