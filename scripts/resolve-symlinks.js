#!/usr/bin/env node

/**
 * ⚠️ 注意: このスクリプトは Cloudflare Workers 環境では使用しません
 * 
 * OpenNext.jsのビルド出力内のシンボリックリンクを解決するスクリプト
 * Cloudflare Pagesはシンボリックリンクをサポートしていないため、実際のファイルにコピーする
 * 
 * Cloudflare Workers 環境では、OpenNext v2 が生成する .open-next/worker.js と
 * .open-next/assets を直接使用するため、このスクリプトは不要です。
 * このスクリプトを実行すると、OpenNext v2 の生成物を破壊する可能性があります。
 * 
 * 現在のプロジェクトは Cloudflare Workers 構成のため、このスクリプトは使用されていません。
 */

const fs = require('fs');
const path = require('path');

function resolveSymlinks(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      let stat;
      
      try {
        stat = fs.lstatSync(fullPath);
      } catch (err) {
        // ファイルが削除された場合などはスキップ
        continue;
      }

      if (stat.isSymbolicLink()) {
        try {
          // シンボリックリンクのターゲットを取得
          const target = fs.readlinkSync(fullPath);
          const targetPath = path.isAbsolute(target)
            ? target
            : path.resolve(path.dirname(fullPath), target);

          // ターゲットが存在するか確認
          if (!fs.existsSync(targetPath)) {
            console.warn(`Warning: Symlink target does not exist: ${fullPath} -> ${targetPath}`);
            // ターゲットが存在しない場合はシンボリックリンクを削除してスキップ
            fs.unlinkSync(fullPath);
            continue;
          }

          // ターゲットの情報を取得
          const targetStat = fs.statSync(targetPath);

          // シンボリックリンクを削除
          fs.unlinkSync(fullPath);

          // ターゲットがディレクトリの場合
          if (targetStat.isDirectory()) {
            // ディレクトリを再帰的にコピー
            fs.mkdirSync(fullPath, { recursive: true });
            copyDirectory(targetPath, fullPath);
          } else {
            // ファイルをコピー
            fs.copyFileSync(targetPath, fullPath);
          }

          console.log(`Resolved symlink: ${fullPath} -> ${targetPath}`);
        } catch (err) {
          // エラーが発生した場合は警告を出してスキップ
          console.warn(`Warning: Failed to resolve symlink ${fullPath}: ${err.message}`);
          // シンボリックリンクが残っている場合は削除を試みる
          try {
            if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isSymbolicLink()) {
              fs.unlinkSync(fullPath);
            }
          } catch (unlinkErr) {
            // 削除に失敗しても続行
          }
        }
      } else if (stat.isDirectory()) {
        // ディレクトリの場合は再帰的に処理
        resolveSymlinks(fullPath);
      }
    }
  } catch (err) {
    // ディレクトリの読み取りに失敗した場合は警告を出して続行
    console.warn(`Warning: Failed to read directory ${dir}: ${err.message}`);
  }
}

function copyDirectory(src, dest) {
  try {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      try {
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDirectory(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch (err) {
        console.warn(`Warning: Failed to copy ${srcPath} to ${destPath}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`Warning: Failed to read directory ${src}: ${err.message}`);
  }
}

const openNextDir = path.join(process.cwd(), '.open-next');

if (!fs.existsSync(openNextDir)) {
  console.error('Error: .open-next directory not found');
  process.exit(1);
}

console.log('Resolving symlinks in .open-next directory...');
resolveSymlinks(openNextDir);

// Cloudflare Pagesは_worker.jsを探すが、OpenNext.jsはworker.jsを生成する
// worker.jsを_worker.jsにコピーする
const workerJs = path.join(openNextDir, 'worker.js');
const workerJsUnderscore = path.join(openNextDir, '_worker.js');

if (!fs.existsSync(workerJs)) {
  console.error('Error: worker.js not found in .open-next directory');
  console.error('This usually means OpenNext.js build failed or did not complete successfully.');
  process.exit(1);
}

// _worker.jsが既に存在する場合も上書きする（常に最新のworker.jsをコピー）
try {
  fs.copyFileSync(workerJs, workerJsUnderscore);
  console.log(`Copied worker.js to _worker.js for Cloudflare Pages compatibility`);
} catch (err) {
  console.error(`Error: Failed to copy worker.js to _worker.js: ${err.message}`);
  process.exit(1);
}

console.log('Done!');

