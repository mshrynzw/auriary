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

  // まず、Cloudflare Workers でサポートされていないモジュールを空のオブジェクトに置き換え
  // これは、他の処理の前に実行する必要がある（node: プレフィックスを追加する前に）
  // timers の特別処理: node:timers と timers の両方を空のオブジェクトに置き換え
  // Cloudflare Workers では setTimeout/setInterval などのグローバル関数が利用可能なので、
  // timers モジュールは不要（空のオブジェクトで置き換え）
  modified = modified.replace(/require\(["']node:timers["']\)/g, '({}) /* timers not needed in Cloudflare Workers - global functions available */');
  modified = modified.replace(/require\(['"]node:timers['"]\)/g, "({}) /* timers not needed in Cloudflare Workers - global functions available */");
  modified = modified.replace(/require\(["']timers["']\)/g, '({}) /* timers not needed in Cloudflare Workers - global functions available */');
  modified = modified.replace(/require\(['"]timers['"]\)/g, "({}) /* timers not needed in Cloudflare Workers - global functions available */");

  // 他の unsupportedModules も同様に処理（必要に応じて）
  for (const module of unsupportedModules) {
    if (module !== 'timers') {
      // timers 以外の unsupportedModules も空のオブジェクトに置き換え
      const pattern1 = new RegExp(`require\\(["']node:${module}["']\\)`, 'g');
      modified = modified.replace(pattern1, `({}) /* ${module} not supported in Cloudflare Workers */`);

      const pattern2 = new RegExp(`require\\(['"]node:${module}['"]\\)`, 'g');
      modified = modified.replace(pattern2, `({}) /* ${module} not supported in Cloudflare Workers */`);

      const pattern3 = new RegExp(`require\\(["']${module}["']\\)`, 'g');
      modified = modified.replace(pattern3, `({}) /* ${module} not supported in Cloudflare Workers */`);

      const pattern4 = new RegExp(`require\\(['"]${module}['"]\\)`, 'g');
      modified = modified.replace(pattern4, `({}) /* ${module} not supported in Cloudflare Workers */`);
    }
  }

  // require("module") を require("node:module") に置換
  // ただし、timers は既に空のオブジェクトに置き換えられているので、スキップされる
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

  // worker.js と _worker.js も処理
  const workerJs = path.join(openNextDir, 'worker.js');
  if (fs.existsSync(workerJs)) {
    const content = fs.readFileSync(workerJs, 'utf8');
    const modified = addNodePrefix(content);
    if (content !== modified) {
      fs.writeFileSync(workerJs, modified, 'utf8');
      console.log(`✅ Updated: .open-next/worker.js`);
    }
  }

  const workerJsUnderscore = path.join(openNextDir, '_worker.js');
  if (fs.existsSync(workerJsUnderscore)) {
    const content = fs.readFileSync(workerJsUnderscore, 'utf8');
    const modified = addNodePrefix(content);
    if (content !== modified) {
      fs.writeFileSync(workerJsUnderscore, modified, 'utf8');
      console.log(`✅ Updated: .open-next/_worker.js`);
    }
  }

  console.log('✨ Done adding node: prefix');
} catch (error) {
  console.error('❌ Error processing files:', error.message);
  process.exit(1);
}

