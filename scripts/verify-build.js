#!/usr/bin/env node

/**
 * OpenNext v2 ビルド出力の確認スクリプト
 * ビルドが正常に完了したことを確認し、必要なファイルが生成されているかチェックします
 */

const fs = require('fs');
const path = require('path');

const openNextDir = path.join(process.cwd(), '.open-next');

console.log('\n✨ Build completed\n');

if (!fs.existsSync(openNextDir)) {
  console.error('❌ Error: .open-next directory not found');
  process.exit(1);
}

console.log('📁 Output:');

// worker.js の確認
const workerJs = path.join(openNextDir, 'worker.js');
if (fs.existsSync(workerJs)) {
  console.log('  ✅ .open-next/worker.js');
} else {
  console.log('  ❌ .open-next/worker.js (missing)');
}

// assets ディレクトリの確認
const assetsDir = path.join(openNextDir, 'assets');
if (fs.existsSync(assetsDir)) {
  console.log('  ✅ .open-next/assets/');
  
  // _next/static の確認
  const nextStaticDir = path.join(assetsDir, '_next', 'static');
  if (fs.existsSync(nextStaticDir)) {
    console.log('  ✅ .open-next/assets/_next/static/');
  } else {
    console.log('  ⚠️  .open-next/assets/_next/static/ (missing)');
  }
} else {
  console.log('  ❌ .open-next/assets/ (missing)');
}

// server-functions ディレクトリの確認
const serverFunctionsDir = path.join(openNextDir, 'server-functions');
if (fs.existsSync(serverFunctionsDir)) {
  console.log('  ✅ .open-next/server-functions/');
} else {
  console.log('  ⚠️  .open-next/server-functions/ (missing)');
}

console.log('');

