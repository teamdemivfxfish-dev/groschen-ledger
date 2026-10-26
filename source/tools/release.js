// Publishes an update to GitHub so every installed app finds it with "Check for updates".
//   1. bump content-version.txt (e.g. 2026.10.30.1) and write what changed in content-notes.txt
//   2. npm run content            (rebuilds the page from the recipe data and writes the manifest)
//   3. npm run release            (data-only update: recipes, icons, page)
//      npm run release -- --app   (also attaches the new .exe files; run `npm run dist` first and bump package.json's version)
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), C = path.join(ROOT, 'content');
const PKG = require('../package.json');
const repo = PKG.ledger.repo;
const m = JSON.parse(fs.readFileSync(path.join(C, 'content-manifest.json'), 'utf8'));
const withApp = process.argv.includes('--app');
if (withApp) m.minApp = m.minApp || PKG.version;

const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-release-'));
const assets = [];
for (const f of m.files) { const to = path.join(stage, f.asset); fs.copyFileSync(path.join(C, f.path), to); assets.push(to); }
const man = path.join(stage, 'content-manifest.json'); fs.writeFileSync(man, JSON.stringify(m, null, 1)); assets.push(man);
if (withApp) for (const f of fs.readdirSync(path.join(ROOT, 'dist')))
  if (f.startsWith(`GroschenLedger-${PKG.version}`) && f.endsWith('.exe')) assets.push(path.join(ROOT, 'dist', f));

// the README's download links point straight at the newest app's .exe files (the latest release is usually data only)
const README = path.join(ROOT, '..', 'README.md');
const LINK = /releases\/download\/[^/\s)]+\/GroschenLedger-[\d.]+-(setup|portable)\.exe/g;
let readme = fs.readFileSync(README, 'utf8');
if (withApp) {
  readme = readme.replace(LINK, (x, kind) => `releases/download/${m.tag}/GroschenLedger-${PKG.version}-${kind}.exe`);
  fs.writeFileSync(README, readme);
}
const dl = kind => `https://github.com/${repo}/` + (readme.match(LINK) || []).find(x => x.endsWith(`-${kind}.exe`));
const notes = [m.notes || 'Updated recipes and prices data.', '',
  withApp ? `Download **GroschenLedger-${PKG.version}-setup.exe** (installs, adds a Start menu shortcut) or the **portable** .exe (runs as is).`
          : `Already have the app? Open it and press **Check for updates**. New here? Download the [installer](${dl('setup')}) or the [portable version](${dl('portable')}), or read the [setup guide](https://github.com/${repo}#readme).`].join('\n');
const gh = (...a) => execFileSync('gh', a, { stdio: 'inherit' });
gh('release', 'create', m.tag, '--repo', repo, '--title', `Groschen Ledger · data ${m.version}${withApp ? ` · app ${PKG.version}` : ''}`, '--notes', notes, '--latest', ...assets);
fs.rmSync(stage, { recursive: true, force: true });
console.log(`Released ${m.tag} to https://github.com/${repo}/releases/tag/${m.tag}`);
if (withApp) console.log('README download links now point at this release: commit and push README.md');
