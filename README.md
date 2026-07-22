# New Tab By Mehrshad

A customizable new tab page for Chrome, built with React and Vite. Replaces the
default new tab with a clean start page featuring a wallpaper, clock, weather,
a todo list, quick shortcuts, and a Google apps launcher.

## Features

- 🖼️ **Wallpapers** — pick from a built-in gallery of backgrounds.
- 🕐 **Clock & Weather** — show the time and current weather for multiple cities.
- ✅ **Todo list** — a simple task list that lives in the new tab.
- 🔖 **Shortcuts** — customizable quick links with logos, labels, and colors.
- 🟦 **Google launcher** — quick access to Google apps.
- ⚙️ **Settings** — configure the left panel, wallpaper, and shortcuts. All
  preferences are stored locally in the browser (`localStorage`).

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
- **`main` branch** — the built extension output.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Ant Design](https://ant.design/)
- Sass, Weather via [OpenWeatherMap](https://openweathermap.org/)

## License

[MIT](./LICENSE) © Ali Dadashzadeh (Mehrshad)
