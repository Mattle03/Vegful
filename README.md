# Vegful, installable web app

Complete your nutrition.

Works on Android and iPhone. Friends open one link and add it to their home screen.
It then opens full screen with its own icon and works offline. Each person's data stays on their own phone.

## 1. Put it online (free, about 5 minutes)

### Option A: Netlify Drop (easiest, no Git)
1. Open https://app.netlify.com/drop on a computer.
2. Drag the whole `vegful` folder onto the page.
3. You get a link like `https://something.netlify.app`. Create a free account when asked, so the site stays online.
4. Optional: in Site settings, rename it, for example `plate-check.netlify.app`.

### Option B: GitHub Pages
1. Create a new public repository, for example `plate-check`.
2. Upload all files from this folder (keep the `icons` folder).
3. Settings, Pages, Source: `main` branch, root. Save.
4. After a minute the app is at `https://YOURNAME.github.io/plate-check/`.

Both give HTTPS, which installing needs.

## 2. Install on a phone

**Android (Chrome):** open the link, tap the menu (three dots), then "Install app" or "Add to Home screen".

**iPhone (Safari):** open the link in Safari, tap Share, then "Add to Home Screen". Other browsers on iPhone cannot install.

## 3. Updating

1. Replace `index.html` with the new version.
2. In `sw.js`, raise the version: `vegful-v87` to `vegful-v88` (raise it by one each time).
3. Upload again (Netlify: drag the folder onto the site's Deploys page; GitHub: commit).

Phones load the new version the next time the app is opened online.

## Barcode scanning

Use the Scan tab to check products in the shop, or "Scan" inside a meal to add one directly. Product data comes from Open Food Facts (free, no key).
- The camera needs the app online over HTTPS (Netlify or GitHub Pages both are) and camera permission.
- On Android Chrome the built in barcode detector is used; on iPhone the bundled ZXing library (`vendor/zxing.min.js`, MIT license).
- Not vegan or unknown products need a confirmation before saving. Vitamins and minerals not on the label are estimated from the recognised ingredients (Open Food Facts ingredient taxonomy, works for every label language), or from a similar food. B12, vitamin D and iodine only count when the label lists them.
- Saved products are in Library, My foods.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app |
| `manifest.webmanifest` | Name, colors, icons for installing |
| `sw.js` | Offline support |
| `icons/` | App icons for Android and iPhone |
| Food database | 70 core foods plus about 1,100 vegan foods from USDA SR Legacy (public domain), built into `index.html` |
| Food icons | Twemoji graphics (CC BY 4.0), built into `index.html` |
| `vendor/zxing.min.js` | Barcode reader for iPhone (ZXing, MIT license) |

## Limits of this version

- Data lives in each phone's browser storage. Deleting the app or clearing browser data deletes it. Use Profile, Save backup file, now and then. No sync between devices yet.
- On iPhone, Safari can clear storage of web apps not opened for several weeks.
- Fonts load from Google Fonts on first start; offline afterwards.
- Dish photos are stored on the phone (IndexedDB), resized to 640 px.
