#!/usr/bin/env node

/**
 * OpenNext.jsのビルド出力内のシンボリックリンクを解決するスクリプト
 * Cloudflare Pagesはシンボリックリンクをサポートしていないため、実際のファイルにコピーする
 */

const fs = require('fs');
const path = require('path');

function resolveSymlinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const stat = fs.lstatSync(fullPath);

    if (stat.isSymbolicLink()) {
      // シンボリックリンクのターゲットを取得
      const target = fs.readlinkSync(fullPath);
      const targetPath = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(fullPath), target);

      // シンボリックリンクを削除
      fs.unlinkSync(fullPath);

      // ターゲットがディレクトリの場合
      if (fs.statSync(targetPath).isDirectory()) {
        // ディレクトリを再帰的にコピー
        fs.mkdirSync(fullPath, { recursive: true });
        copyDirectory(targetPath, fullPath);
      } else {
        // ファイルをコピー
        fs.copyFileSync(targetPath, fullPath);
      }

      console.log(`Resolved symlink: ${fullPath} -> ${targetPath}`);
    } else if (stat.isDirectory()) {
      // ディレクトリの場合は再帰的に処理
      resolveSymlinks(fullPath);
    }
  }
}

function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const openNextDir = path.join(process.cwd(), '.open-next');

if (!fs.existsSync(openNextDir)) {
  console.error('Error: .open-next directory not found');
  process.exit(1);
}

console.log('Resolving symlinks in .open-next directory...');
resolveSymlinks(openNextDir);
console.log('Done!');

