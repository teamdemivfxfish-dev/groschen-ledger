// Groschen Ledger, desktop app.
// The page lives in content/ (shipped with the app) or in an updated copy under the user's data folder.
// "Check for updates" reads content-manifest.json from the latest GitHub release: new recipes, icons or page
// are downloaded file by file, checked against their SHA-256, and used from the next start.
const { app, BrowserWindow, ipcMain, protocol, net, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const PKG = require('./package.json');
const REPO = (PKG.ledger && PKG.ledger.repo) || 'teamdemivfxfish-dev/groschen-ledger';
const MANIFEST_URL = `https://github.com/${REPO}/releases/latest/download/content-manifest.json`;
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
const BUNDLED = path.join(__dirname, 'content');

app.setAppUserModelId('dev.teamdemivfxfish.groschenledger');   // the packager drops package.json's build section, so not read from there
protocol.registerSchemesAsPrivileged([{ scheme: 'ledger', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

const dataDir = () => path.join(app.getPath('userData'), 'content');
const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } };
const versionOf = (dir) => (readJSON(path.join(dir, 'content-manifest.json')) || {}).version || '0';
// versions are dates with a counter, e.g. 2026.10.23.1
const newer = (a, b) => {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d > 0; }
  return false;
};
// the content folder in use: the downloaded one when it is newer than what shipped with this app
function contentDir() {
  const cur = readJSON(path.join(dataDir(), 'current.json'));
  if (cur && cur.dir) {
    const d = path.join(dataDir(), cur.dir);
    if (fs.existsSync(path.join(d, 'index.html')) && newer(versionOf(d), versionOf(BUNDLED))) return d;
  }
  return BUNDLED;
}

let win, active;
const tlog = (...a) => { if (process.env.LEDGER_SNAPSHOT) fs.appendFileSync(process.env.LEDGER_SNAPSHOT + '.log', a.join(' ') + '\n'); };
function createWindow() {
  active = contentDir();
  win = new BrowserWindow({
    width: 1280, height: 900, minWidth: 420, minHeight: 500,
    backgroundColor: '#100c0a', title: 'Groschen Ledger', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  // links to other sites (the wiki) open in the browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('ledger://')) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); } });
  win.webContents.on('did-fail-load', (_e, code, desc, url) => tlog('load failed', code, desc, url));
  win.webContents.on('console-message', (e) => { if (process.env.LEDGER_SNAPSHOT) tlog('page:', e.message); });
  win.loadURL('ledger://app/index.html');
  // test mode: LEDGER_SNAPSHOT=<file.png> saves what the window shows and quits
  if (process.env.LEDGER_SNAPSHOT) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    if (process.env.LEDGER_HASH) await win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(process.env.LEDGER_HASH)}`);
    if (process.env.LEDGER_CLICK) await win.webContents.executeJavaScript(`document.getElementById(${JSON.stringify(process.env.LEDGER_CLICK)})?.click()`);
    setTimeout(async () => { fs.writeFileSync(process.env.LEDGER_SNAPSHOT, (await win.webContents.capturePage()).toPNG()); app.quit(); }, 2500);
  }, 1500));
}

app.whenReady().then(() => {
  tlog('ready', __dirname, BUNDLED, fs.existsSync(path.join(BUNDLED, 'index.html')));
  // one stable origin (ledger://app) whichever content folder is in use, so the saved prices survive updates
  protocol.handle('ledger', (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(active, rel));
    if (!file.startsWith(active)) return new Response('Not found', { status: 404 });
    tlog('serve', file);
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());

// ---- updates ----
async function getJSON(url) {
  const r = await net.fetch(url, { cache: 'no-store' });
  if (r.status === 404) throw new Error('No release has been published yet');
  if (!r.ok) throw new Error(`GitHub answered ${r.status}`);
  return r.json();
}
let pending = null;
ipcMain.on('ledger:info-sync', (e) => { e.returnValue = { appVersion: PKG.version, contentVersion: versionOf(active) }; });
ipcMain.handle('ledger:check', async () => {
  try {
    const m = await getJSON(MANIFEST_URL);
    if (m.minApp && newer(m.minApp, PKG.version)) return { state: 'app', version: m.minApp };
    if (!newer(m.version, versionOf(active))) return { state: 'current' };
    pending = m;
    return { state: 'content', version: m.version, notes: m.notes || '' };
  } catch (e) {
    return { state: 'error', message: e.message === 'fetch failed' ? 'No internet connection' : e.message };
  }
});
ipcMain.handle('ledger:install', async (evt) => {
  const m = pending; if (!m) return { state: 'error', message: 'Check for updates first' };
  const dir = `v${m.version}`, dest = path.join(dataDir(), dir), tmp = dest + '.part';
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
    let done = 0;
    for (const f of m.files) {
      if (!/^[A-Za-z0-9_\-./]+$/.test(f.path) || f.path.includes('..')) throw new Error('Bad file name in the update');
      const out = path.join(tmp, f.path); fs.mkdirSync(path.dirname(out), { recursive: true });
      // a file this copy already has (same hash) is copied, not downloaded again
      const have = [active, BUNDLED].map((d) => path.join(d, f.path)).find((p) => fs.existsSync(p) && sha(fs.readFileSync(p)) === f.sha256);
      let buf;
      if (have) buf = fs.readFileSync(have);
      else {
        const r = await net.fetch(`https://github.com/${REPO}/releases/download/${m.tag}/${f.asset}`);
        if (!r.ok) throw new Error(`Download failed (${r.status}) for ${f.path}`);
        buf = Buffer.from(await r.arrayBuffer());
        if (sha(buf) !== f.sha256) throw new Error(`${f.path} did not download correctly`);
      }
      fs.writeFileSync(out, buf);
      evt.sender.send('ledger:progress', { done: ++done, total: m.files.length });
    }
    fs.writeFileSync(path.join(tmp, 'content-manifest.json'), JSON.stringify(m, null, 1));
    fs.rmSync(dest, { recursive: true, force: true }); fs.renameSync(tmp, dest);
    fs.writeFileSync(path.join(dataDir(), 'current.json'), JSON.stringify({ dir }));
    return { state: 'ready', version: m.version };
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    return { state: 'error', message: e.message === 'fetch failed' ? 'No internet connection' : e.message };
  }
});
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
ipcMain.handle('ledger:restart', () => { app.relaunch(); app.exit(0); });
ipcMain.handle('ledger:releases', () => shell.openExternal(RELEASES_URL));
