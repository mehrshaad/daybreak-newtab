# Daybreak — New Tab

**Start every tab fresh.** Daybreak replaces Chrome's new tab page with a calm,
customizable start page — a wallpaper, clock, weather, a to‑do list, quick
shortcuts, and a Google apps launcher. Built with React and Vite.

## Features

- 🌅 **Wallpapers** — pick from a built-in gallery of backgrounds.
- 🕐 **Clock & weather** — show the time and current weather for multiple cities.
- ✅ **To‑do list** — a simple task list that lives in your new tab.
- 🔖 **Shortcuts** — customizable quick links with logos, labels, and colors.
- 🟦 **Google launcher & search** — quick access to Google apps and search.
- ⚙️ **Settings** — configure the side panel, wallpaper, and shortcuts. All
  preferences are stored locally in your browser (`localStorage`).

## Privacy

Daybreak keeps your data on your device. Settings live in `localStorage` and are
never sent to the developer. The only outbound requests are your configured
**city names** to OpenWeatherMap (for weather) and your **search queries** to
Google (when you use the search box). Full policy:
[privacy-policy](https://ali-dadashzadeh.ir/daybreak-newtab/privacy-policy.html).

## Install

### From the Chrome Web Store

_Coming soon._

### Load unpacked (from a build)

1. Download or build the `dist/` output (see [Development](#development)).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the build output folder.
5. Open a new tab.

## Development

Requires [Node.js](https://nodejs.org/) 18+.

```bash
# install dependencies
npm install

# start the dev server (regular web page, for fast iteration)
npm run dev

# lint
npm run lint

# production build -> dist/
npm run build
```

The production build in `dist/` is a complete, loadable Chrome extension
(`manifest.json` is bundled from `public/`).

## Repository layout

- **`codes` branch** — the source code (this branch).
- **`main` branch** — the built extension output, plus the hosted privacy policy.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Ant Design](https://ant.design/)
- Sass, weather via [OpenWeatherMap](https://openweathermap.org/)

## License

[MIT](./LICENSE) © Ali Dadashzadeh (Mehrshad)
