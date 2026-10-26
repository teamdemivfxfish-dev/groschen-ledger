// Writes content/content-manifest.json: the data version, the oldest app that can show it, and every file's SHA-256.
// The data version comes from content-version.txt (e.g. 2026.10.23.1); bump it whenever the recipes, icons or page change.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), C = path.join(ROOT, 'content');
const version = fs.readFileSync(path.join(ROOT, 'content-version.txt'), 'utf8').trim();
const notesFile = path.join(ROOT, 'content-notes.txt');
const notes = fs.existsSync(notesFile) ? fs.readFileSync(notesFile, 'utf8').trim() : '';
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f !== 'content-manifest.json') {
      const rel = path.relative(C, p).split(path.sep).join('/');
      files.push({ path: rel, asset: rel.replace(/\//g, '__'), sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') });
    }
  }
})(C);
const m = { app: 'groschen-ledger', version, minApp: '1.0.0', tag: `data-${version}`, notes, files };
fs.writeFileSync(path.join(C, 'content-manifest.json'), JSON.stringify(m, null, 1));
console.log(`content ${version}: ${files.length} files`);
