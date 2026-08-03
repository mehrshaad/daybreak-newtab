# Daybreak - New Tab

**Start every tab fresh.** Daybreak replaces Chrome's new tab page with a
customizable widget dashboard — a grid of tiles you arrange yourself, with a
clock, weather, world clocks, tasks, quick links and more. Built with React and
Vite.

## Features

- 🧩 **A board you arrange** — drag tiles around, resize them, and keep as many
  or as few as you like. Four layout presets to start from.
- 🔍 **Click to focus** — click a tile to zoom into it. Four behaviours to
  choose from, including a camera zoom that scales the whole board toward the
  tile you picked.
- 🎨 **Themed end to end** — dark and light, six accent colours, four generated
  backgrounds, and sliders for grid spacing, corner radius and tile opacity.
- 🛍️ **A widget browser** — search the catalog by name or category, read what
  each widget does and what it can access, and add or remove it in a click.
- ⌨️ **Right-click anything** — per-widget menus with sizes and actions, a board
  menu on empty space, and keyboard shortcuts for search, layout mode and the
  widget list.
- 💾 **Yours to keep** — export your whole setup to a file and import it back.

### The widgets

| Widget | What it does |
| --- | --- |
| Clock | Time and today's date, optionally with seconds |
| World Clocks | Two to four cities at once, with a day-offset badge |
| Weather | Current conditions and the next few hours |
| Tasks | A to-do list with optional due dates |
| Quick Links | Pinned shortcuts with generated app-style icons |
| Google Apps | The launcher grid, without the extra click |
| Scratchpad | One text field that saves as you type |
| Focus Timer | Pomodoro rounds with a long break every fourth |
| Habits | A seven-day dot grid per habit |
| Quote of the day | One line, changed daily |
| Recent Tabs | Reopen what you closed by accident (optional permission) |

## Privacy

Your data stays on your device. Settings are saved with Chrome's own
`storage.sync`, so they follow your signed-in profile; widget content like
scratchpad text and habit history stays local. Nothing is sent to the
developer — no analytics, no tracking, no accounts.

The extension requests **one** permission up front: `storage`, to save your
settings. One more is **optional** and only requested if you add the widget
that needs it: `sessions`, for Recent Tabs. It does not ask for your bookmarks,
your history, or the content of sites you visit.

The only outbound requests are your chosen **city** to
[Open-Meteo](https://open-meteo.com/) for weather — no API key and no account —
and your **search queries** to whichever engine you've selected. Icons and
backgrounds are bundled or generated, so simply opening a new tab contacts
nobody. Full policy:
[Privacy Policy](https://ali-dadashzadeh.ir/daybreak-newtab/privacy-policy.html).

## Install

### Chrome Web Store

_Coming soon._

### Load unpacked

1. Download the latest `daybreak-newtab-*.zip` from the
   [Releases](https://github.com/mehrshaad/daybreak-newtab/releases) page and
   unzip it (or build it yourself — see [Development](#development)).
2. Open `chrome://extensions/`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the unzipped folder.
5. Open a new tab.

Upgrading from v1 keeps your settings: your name, search engine, city, to-dos
and shortcuts are migrated the first time v2 runs, and both of your v1 cities
become world clocks.

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
`chrome.*` API, so settings fall back to `localStorage` and widgets that need a
Chrome API say so instead of breaking.

### Writing a widget

A widget is a folder. The catalog builds itself from the folders in
`src/widgets/`, so adding one means dropping it in and rebuilding — there is no
registry to edit:

```
src/widgets/my-widget/
  manifest.js     name, sizes, options, permissions
  Widget.jsx      the component
```

The full contract — every manifest field, the props a widget receives, and
where to keep its data — is in [`src/sdk/types.md`](./src/sdk/types.md).

## Repository layout

- `main` branch (default) — the source code, plus the hosted privacy policy.
- `v1` branch — frozen archive of the released v1.1.0.
- `v2` branch — the widget dashboard rebuild.
- `design/Daybreak.dc.html` — the v2 design prototype this was built from.

## Credits

- Weather data from [Open-Meteo](https://open-meteo.com/)
- Fonts: [DM Sans](https://fonts.google.com/specimen/DM+Sans) and
  [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), bundled
  under the SIL Open Font License
- Icons from [React Icons](https://react-icons.github.io/react-icons/)
- Built with [React](https://react.dev/) and [Vite](https://vite.dev/)

## License

[MIT](./LICENSE) © Ali Dadashzadeh (Mehrshad)
