#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = join(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

async function fixImports(filePath) {
  if (!filePath.endsWith('.ts')) return false;
  
  let content = await readFile(filePath, 'utf-8');
  let modified = false;
  
  // Fix relative imports - add .js extension
  // Match: from './xxx' or from '../xxx' or from './xxx/yyy'
  const regex = /from\s+['"](\.[^'"]*)['"]/g;
  
  const newContent = content.replace(regex, (match, path) => {
    // Skip if already has extension
    if (path.endsWith('.js') || path.endsWith('.json')) {
      return match;
    }
    
    modified = true;
    return match.replace(path, path + '.js');
  });
  
  if (modified) {
    await writeFile(filePath, newContent, 'utf-8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

async function main() {
  const srcDir = './src';
  let count = 0;
  
  console.log('Fixing ES module imports...\n');
  
  for await (const file of getFiles(srcDir)) {
    const fixed = await fixImports(file);
    if (fixed) count++;
  }
  
  console.log(`\n✓ Fixed ${count} files`);
}

main().catch(console.error);
