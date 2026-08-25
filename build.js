/**
 * Build script for Vercel deployment
 * 
 * Assembles public-site + admin-site into a unified dist/ folder:
 * 
 *   dist/
 *   ├── index.html          (portfolio)
 *   ├── app.js
 *   ├── particles.js
 *   ├── styles.css
 *   ├── shared/
 *   │   ├── data-store.js
 *   │   └── supabase-config.js
 *   └── admin/
 *       ├── index.html       (editor)
 *       ├── admin-app.js
 *       ├── admin-styles.css
 *       └── shared/          → symlink / copy of shared
 */

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');

// ── Helpers ──────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${path.relative(__dirname, dest)}`);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// ── Build ────────────────────────────────────────────────────────────

console.log('\n🔨 Building portfolio for deployment...\n');

// 1. Clean dist/
cleanDir(DIST);

// 2. Copy public-site → dist/ (root level)
console.log('📄 Copying public-site → dist/');
const publicSrc = path.join(__dirname, 'public-site');
const publicFiles = fs.readdirSync(publicSrc, { withFileTypes: true });
for (const entry of publicFiles) {
  if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'package-lock.json') continue;
  const srcPath = path.join(publicSrc, entry.name);
  const destPath = path.join(DIST, entry.name);
  if (entry.isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    copyFile(srcPath, destPath);
  }
}

// 3. Copy shared/ → dist/shared/
console.log('\n📦 Copying shared/ → dist/shared/');
copyDir(path.join(__dirname, 'admin', 'shared'), path.join(DIST, 'shared'));

// 4. Copy admin-site → dist/admin/
console.log('\n🔧 Copying admin-site → dist/admin/');
const adminSrc = path.join(__dirname, 'admin', 'admin-site');
const adminFiles = fs.readdirSync(adminSrc, { withFileTypes: true });
for (const entry of adminFiles) {
  if (entry.name === '.git' || entry.name === 'node_modules') continue;
  const srcPath = path.join(adminSrc, entry.name);
  const destPath = path.join(DIST, 'admin', entry.name);
  if (entry.isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    copyFile(srcPath, destPath);
  }
}

// 5. Also copy shared/ → dist/admin/shared/ so ../shared/ references from admin work
//    (admin's index.html uses "../shared/data-store.js" — in dist/admin/ that resolves to dist/shared/)
//    The path ../shared/ from dist/admin/ already points to dist/shared/, so NO extra copy needed!
//    But let's verify and fix the script paths in admin's index.html to be safe.

// 6. Fix admin's index.html script paths:
//    Original: src="../shared/data-store.js" 
//    In dist: dist/admin/index.html → ../shared/ → dist/shared/ ✓ (this works!)
//    So no changes needed for script paths.

// 7. Fix admin's preview iframe path:
//    Original: src="../public-site/index.html"
//    In dist: should be src="../index.html" (since portfolio is at dist/index.html)
const adminIndexPath = path.join(DIST, 'admin', 'index.html');
if (fs.existsSync(adminIndexPath)) {
  let adminHtml = fs.readFileSync(adminIndexPath, 'utf-8');
  adminHtml = adminHtml.replace(
    'src="../public-site/index.html"',
    'src="../index.html"'
  );
  // Also fix shared paths from admin-site perspective
  // ../shared/ from dist/admin/ points to dist/shared/ which exists ✓
  fs.writeFileSync(adminIndexPath, adminHtml);
  console.log('\n  ✓ Fixed preview iframe path in admin/index.html');
}

// 8. Fix public-site index.html shared paths:
//    Original: src="../shared/data-store.js" (relative to public-site/)
//    In dist: src="shared/data-store.js" (shared/ is at same level as index.html)
const publicIndexPath = path.join(DIST, 'index.html');
if (fs.existsSync(publicIndexPath)) {
  let publicHtml = fs.readFileSync(publicIndexPath, 'utf-8');
  publicHtml = publicHtml.replace(
    'src="../shared/data-store.js"',
    'src="shared/data-store.js"'
  );
  fs.writeFileSync(publicIndexPath, publicHtml);
  console.log('  ✓ Fixed shared data-store path in index.html');
}

console.log('\n✅ Build complete! Output → dist/\n');

// Print final structure
function printTree(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    console.log(`${prefix}${connector}${entry.name}${entry.isDirectory() ? '/' : ''}`);
    if (entry.isDirectory()) {
      printTree(path.join(dir, entry.name), prefix + (isLast ? '    ' : '│   '));
    }
  });
}

console.log('dist/');
printTree(DIST);
console.log('');
