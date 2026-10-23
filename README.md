# Groschen Ledger

What it costs to make every craftable piece on the KCD Roleplay server (KCD:MP for Kingdom Come: Deliverance II), from your own market prices. Set what raw goods fetch at the auction house; the ledger works out every part (steel bars, leather, hafts…) and every finished piece, bench fees included.

**Download:** grab `GroschenLedger-…-setup.exe` (installs) or `…-portable.exe` (runs as is) from [Releases](../../releases/latest). Your prices are kept on your own PC; use Export / Import in the Market prices scroll to move them.

**Updates:** press **Check for updates** in the app. New recipes, icons and fixes download in a few seconds, no reinstall needed.

A fan-made tool, not affiliated with Warhorse Studios, KCD:MP or KCD Roleplay. Item art and illustrations are from Kingdom Come: Deliverance II (Warhorse Studios); furniture pictures are from the KCD Roleplay interface. Recipes from wiki.kcdroleplay.com.

## Building
- `npm install`
- `npm start` runs it from source
- `npm run dist` builds `dist/GroschenLedger-<version>-setup.exe` and `-portable.exe`
- To publish a data update: bump `content-version.txt`, note the change in `content-notes.txt`, then `npm run content` and `npm run release`
