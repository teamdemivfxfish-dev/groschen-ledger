# Groschen Ledger

What it costs to make every craftable piece on the KCD Roleplay server (KCD:MP for Kingdom Come: Deliverance II), from your own market prices. Type in what raw goods fetch at the auction house and the ledger works out every part (steel bars, leather, hafts…) and every finished piece, bench fees included. It also picks the best thing to mass produce for each crafter's trade pack.

It runs on Windows 10 and 11. You don't need a GitHub account, Git, or anything else installed.

## Download

Click one of these and the download starts straight away:

### ⬇ [Download the installer](https://github.com/teamdemivfxfish-dev/groschen-ledger/releases/download/data-2026.10.23.1/GroschenLedger-1.0.0-setup.exe) (recommended)

Installs in a few seconds, puts **Groschen Ledger** in your Start menu and on your desktop, and can be removed later from Windows Settings > Apps like any other program.

### ⬇ [Download the portable version](https://github.com/teamdemivfxfish-dev/groschen-ledger/releases/download/data-2026.10.23.1/GroschenLedger-1.0.0-portable.exe)

A single file that runs as it is, nothing installed. Put it wherever you like (your desktop, a USB stick) and double-click it. It takes a few seconds longer to open than the installed one.

You don't need the `source` folder above, or the green **Code** button. Those hold the program's code, not the program.

## First time you open it

**1. Your browser may warn you about the download.** The file is new and not downloaded by many people yet, so Chrome or Edge can say it "isn't commonly downloaded". Open your downloads list (Ctrl+J), click the warning, and choose **Keep** (in Edge: the **…** menu, then **Keep**, then **Keep anyway**).

**2. Windows may show a blue "Windows protected your PC" box.** This happens with any program that hasn't paid for a Microsoft signing certificate. Click **More info**, then **Run anyway**. You only see it once.

**3. Get the newest recipes.** At the top of the ledger, next to the version number, press **Check for updates**, then **Install update**. The download you just got was built on 23 October, and the recipes and prices have been updated since. This takes a few seconds and you don't reinstall anything.

**4. Set your prices.** Open the **Market prices** scroll and type in what goods sell for at the auction house. The **Needs a price** tab lists the ones the wiki gives no price for. Everything else updates as you type.

## Keeping it up to date

When the server adds or changes recipes, press **Check for updates** in the app. You only need a new download if the app tells you to get one.

## Your prices

Your prices are saved on your own PC and stay there through updates. To move them to another PC or keep a backup, use **Export prices** and **Import prices** at the bottom of the Market prices scroll.

## Something's wrong?

* **Nothing happens when I double-click it:** give it ten seconds, especially the portable version. If it still doesn't open, your antivirus may have quarantined it; check its history and restore the file.
* **"Could not check for updates" or "No internet connection":** the app reaches GitHub to fetch updates. Check your connection and press **Try again**.
* **A recipe or price looks wrong:** the recipes come from [wiki.kcdroleplay.com](https://wiki.kcdroleplay.com/recipes/), which can trail the server by a day or two after a big update. Open an [issue](https://github.com/teamdemivfxfish-dev/groschen-ledger/issues).

A fan-made tool, not affiliated with Warhorse Studios, KCD:MP or KCD Roleplay. Item art and illustrations are from Kingdom Come: Deliverance II (Warhorse Studios); furniture pictures are from the KCD Roleplay interface. Recipes from wiki.kcdroleplay.com.

<details>
<summary>For developers: building from the source folder</summary>

Everything lives in `source/`. Run these from inside it:

* `npm install`
* `npm start` runs it from source
* `npm run dist` builds `dist/GroschenLedger-<version>-setup.exe` and `-portable.exe`
* To publish a data update: bump `content-version.txt`, note the change in `content-notes.txt`, then `npm run content` and `npm run release`
* To publish a new app version: bump `version` in `package.json`, `npm run dist`, then `npm run release -- --app` (this also points the download links in this README at the new files; commit it afterwards)

</details>
