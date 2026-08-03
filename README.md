# Daybreak - New Tab

**Start every tab fresh.** Daybreak replaces Chrome's new tab page with a calm,
customizable start page — a wallpaper, clock, weather, a to‑do list, quick
shortcuts, your Chrome bookmarks, and a Google apps launcher and search. Built
with React and Vite.

## Features

- 🌅 **Wallpapers** — choose from a built-in gallery of backgrounds, or upload
  your own.
- 🕐 **Clock & weather** — time and current weather for the cities you care
  about, with search for any city worldwide.
- ✅ **To‑do list** — jot down tasks right on your new tab, with optional due
  dates and drag‑to‑reorder.
- 🔖 **Shortcuts** — pin favorite sites with custom logos, labels, and colors,
  and drag to reorder them.
- ⭐ **Bookmarks** — reach your existing Chrome bookmarks from the dock and the
  side panel.
- 🟦 **Google apps & search** — quick access to Google apps, and a search box
  that can point at Google, Bing, or DuckDuckGo.
- 📝 **Side widgets** — notes, a Pomodoro timer, and a quote of the day.
- ⚙️ **Settings** — configure the side panel, wallpaper, and shortcuts. Your
  preferences follow your signed‑in Chrome profile, and can be exported and
  re‑imported as a backup file.

## Privacy

Your data stays on your device. Settings are saved with Chrome's own
`storage.sync`, so they follow your signed‑in profile, and are never sent to the
developer — no analytics, no tracking, no accounts.

The extension requests two Chrome permissions:

- **`storage`** — to save your settings.
- **`bookmarks`** — to read your existing bookmarks so they can be shown on the
  new tab. They are only rendered locally and never leave the browser.

The only outbound requests are your configured **city names** to
[Open-Meteo](https://open-meteo.com/) (for weather — no API key and no account
required) and your **search queries** to whichever search engine you've
selected. Shortcut and app icons are drawn from icons bundled with the
extension, so simply opening a new tab contacts nobody. Full policy:
[Privacy Policy](https://ali-dadashzadeh.ir/daybreak-newtab/privacy-policy.html).

## Install

### Chrome Web Store

_Coming soon._

### Load unpacked

1. Download the latest `daybreak-newtab-*.zip` from the
   [Releases](https://github.com/mehrshaad/daybreak-newtab/releases) page and
   unzip it (or build it yourself — see [Development](#development)).
2. Open `chrome://extensions/`.
3. Enable **Developer mode** (top‑right).
4. Click **Load unpacked** and select the unzipped folder.
5. Open a new tab.

## Development

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install      # install dependencies
npm run dev      # dev server (runs as a normal web page)
npm run lint     # lint
npm test         # unit tests
npm run build    # production build -> dist/
```

The `dist/` output is a complete, loadable Chrome extension.

Outside the packaged extension (for example under `npm run dev`) there is no
`chrome.storage` API, so settings fall back to `localStorage` and bookmarks are
unavailable.

## Repository layout

- `main` branch (default) — the source code, plus the hosted privacy policy.
- `v1` branch — frozen archive of the released v1.1.0.
- `v2` branch — in-progress work on the next version.

## Credits

- Weather data from [Open-Meteo](https://open-meteo.com/)
- Wallpapers from [UHD Wallpapers](https://www.uhdpaper.com/)
- Icons from [React Icons](https://react-icons.github.io/react-icons/),
  [Ant Design Icons](https://ant.design/components/icon), and
  [Icons8](https://icons8.com/)
- Built with [React](https://react.dev/) and [Vite](https://vite.dev/)

## License

[MIT](./LICENSE) © Ali Dadashzadeh (Mehrshad)
