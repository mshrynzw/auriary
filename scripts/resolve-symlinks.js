#!/usr/bin/env node

/**
 * Cloudflare Pages 用シンボリックリンク解決スクリプト
 * .open-next ディレクトリ内のシンボリックリンクを実際のファイルにコピーします
 * Cloudflare Pages はシンボリックリンクをサポートしていないため、このスクリプトが必要です
 */

const fs = require('fs');
const path = require('path');

const openNextDir = path.join(process.cwd(), '.open-next');

/**
 * ディレクトリ内のシンボリックリンクを再帰的に解決
 */
function resolveSymlinks(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    try {
      const stats = fs.lstatSync(fullPath);

      if (stats.isSymbolicLink()) {
        // シンボリックリンクの場合、実際のファイル/ディレクトリにコピー
        const targetPath = fs.readlinkSync(fullPath);
        const resolvedTarget = path.isAbsolute(targetPath)
          ? targetPath
          : path.resolve(path.dirname(fullPath), targetPath);

        // 元のシンボリックリンクを削除
        fs.unlinkSync(fullPath);

        // ターゲットが存在する場合、コピー
        if (fs.existsSync(resolvedTarget)) {
          const targetStats = fs.statSync(resolvedTarget);

          if (targetStats.isDirectory()) {
            // ディレクトリの場合、再帰的にコピー
            fs.mkdirSync(fullPath, { recursive: true });
            copyDirectory(resolvedTarget, fullPath);
          } else {
            // ファイルの場合、コピー
            fs.copyFileSync(resolvedTarget, fullPath);
          }
        }
      } else if (stats.isDirectory()) {
        // 通常のディレクトリの場合、再帰的に処理
        resolveSymlinks(fullPath);
      }
    } catch (error) {
      // エラーが発生した場合はスキップ（権限エラーなど）
      console.warn(`Warning: Could not process ${fullPath}: ${error.message}`);
    }
  }
}

/**
 * ディレクトリを再帰的にコピー
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    try {
      if (entry.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (error) {
      console.warn(`Warning: Could not copy ${srcPath} to ${destPath}: ${error.message}`);
    }
  }
}

if (!fs.existsSync(openNextDir)) {
  console.error('❌ Error: .open-next directory not found');
  process.exit(1);
}

console.log('🔗 Resolving symlinks in .open-next directory...');

try {
  resolveSymlinks(openNextDir);
  console.log('✅ Symlinks resolved successfully');
} catch (error) {
  console.error('❌ Error resolving symlinks:', error.message);
  process.exit(1);
}

// Cloudflare Pages は `_worker.js` を探すため、worker.js をコピー
const workerJs = path.join(openNextDir, 'worker.js');
const workerJsUnderscore = path.join(openNextDir, '_worker.js');

if (!fs.existsSync(workerJs)) {
  console.error('❌ Error: .open-next/worker.js not found. Build may have failed.');
  process.exit(1);
}

try {
  fs.copyFileSync(workerJs, workerJsUnderscore);
  console.log('🗂️ Copied worker.js to _worker.js');
} catch (error) {
  console.error('❌ Error copying worker.js to _worker.js:', error.message);
  process.exit(1);
}

console.log('✨ Ready for Cloudflare Pages deploy');

