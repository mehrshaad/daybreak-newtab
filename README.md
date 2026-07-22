# Daybreak — New Tab

**Start every tab fresh.** Daybreak replaces Chrome's new tab page with a calm,
customizable start page — a wallpaper, clock, weather, a to‑do list, quick
shortcuts, and a Google apps launcher and search. Built with React and Vite.

## Features

- 🌅 **Wallpapers** — choose from a built-in gallery of backgrounds.
- 🕐 **Clock & weather** — time and current weather for the cities you care about.
- ✅ **To‑do list** — jot down tasks right on your new tab.
- 🔖 **Shortcuts** — pin favorite sites with custom logos, labels, and colors.
- 🟦 **Google apps & search** — quick access to Google apps and web search.
- ⚙️ **Settings** — configure the side panel, wallpaper, and shortcuts. Your
  preferences are stored locally in your browser (`localStorage`).

## Privacy

Your data stays on your device. Settings live in `localStorage` and are never
sent to the developer — no analytics, no tracking, and the extension requests no
special Chrome permissions. The only outbound requests are your configured
**city names** to OpenWeatherMap (for weather) and your **search queries** to
Google (when you use the search box). Full policy:
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

The source code lives on the
[`codes`](https://github.com/mehrshaad/daybreak-newtab/tree/codes) branch.
Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install      # install dependencies
npm run dev      # dev server (runs as a normal web page)
npm run lint     # lint
npm run build    # production build -> dist/
```

The `dist/` output is a complete, loadable Chrome extension.

## Repository layout

- [`codes`](https://github.com/mehrshaad/daybreak-newtab/tree/codes) branch — the
  source code.
- `main` branch (default) — the built extension output and the hosted privacy
  policy.

## Credits

- Weather data from [OpenWeather](https://openweathermap.org/api)
- Wallpapers from [UHD Wallpapers](https://www.uhdpaper.com/)
- Icons from [React Icons](https://react-icons.github.io/react-icons/),
  [Ant Design Icons](https://ant.design/components/icon), and
  [Icons8](https://icons8.com/)
- Built with [React](https://react.dev/) and [Vite](https://vite.dev/)

## License

[MIT](./LICENSE) © Ali Dadashzadeh (Mehrshad)
