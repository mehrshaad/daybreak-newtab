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
- 🎨 **Themed end to end** — dark and light (or follow your system), six accent
  colours, eight generated backgrounds, and sliders for corner radius, tile
  opacity and page zoom. Frosted glass on, or solid surfaces off.
- 🛍️ **A widget browser** — search the catalog by name or category, read what
  each widget does and what it can access, and add or remove it in a click.
- ⌨️ **Right-click anything** — per-widget menus with sizes and actions, a board
  menu on empty space, and keyboard shortcuts for search, layout mode and the
  widget list.
- 💾 **Yours to keep** — export your whole setup to a file and import it back.

### The widgets

| Widget | What it does |
| --- | --- |
| Clock | Time and today's date, digital or as an analog face |
| World Clocks | Up to four cities at once, reorderable, with a day-offset badge |
| Weather | Conditions and the hours ahead; bigger sizes show more, not just larger |
| Air quality | US AQI and PM2.5/PM10 for a city you pick |
| Tasks | A to-do list with optional due dates |
| Quick Links | Pinned shortcuts with generated app-style icons, your own names, and a hover card with the site's real favicon |
| Google Apps | The launcher grid, without the extra click |
| Scratchpad | One text field that saves as you type, syncing up to 6KB |
| Focus Timer | Pomodoro rounds with a long break every fourth |
| Habits | A seven-day dot grid per habit, each with its own weekly target and goal |
| Currency | Exchange rates for a base currency and up to five others |
| Crypto | A short price watchlist with 24-hour change |
| On this day | One historical event, changed daily, more on a taller tile |
| News | Hacker News' top stories by default, or your own RSS/Atom feed |
| Calendar | Your next two weeks of events from a pasted private iCal link |
| Quote of the day | One line, changed daily |
| Recent Tabs | Reopen what you closed by accident (optional permission) |

New widgets arrive with extension updates — see
[Writing a widget](#writing-a-widget) for why.

## Privacy

Your data stays on your device. Settings are saved with Chrome's own
`storage.sync`, so they follow your signed-in profile; widget content like
scratchpad text and habit history stays local. Nothing is sent to the
developer — no analytics, no tracking, no accounts.

The extension requests **one** permission up front: `storage`, to save your
settings. Five more are **optional**, each requested only when you turn on the
feature that needs it, and revocable at any time:

| Permission | Used by |
| --- | --- |
| `sessions` | Recent Tabs, to list and reopen what you closed |
| `tabs` | search suggestions from the tabs you already have open |
| `history` | search suggestions from pages you have visited |
| `bookmarks` | search suggestions from your bookmarks (read-only) |
| `favicon` | real site icons in search suggestions, from Chrome's own favicon cache — no request to the site |

It declares no host permissions up front, so it starts with no standing access
to any site's content. Calendar and a custom News feed instead ask Chrome, at
the moment you paste the address in, for access to that **one** address only —
never a blanket grant.

The only outbound requests are: your chosen **city** to
[Open-Meteo](https://open-meteo.com/) for weather and air quality — no API key
and no account; your currency/coin choices to Frankfurter and CoinGecko;
today's date (never the year) to Wikipedia's on-this-day feed; Hacker News' own
public API, or a feed you choose instead; a calendar address you paste in,
fetched only from its own provider; and your **search queries** to whichever
engine you've selected. Icons and backgrounds are bundled or generated, so
simply opening a new tab contacts nobody. Full policy:
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

Upgrading from v1 keeps your settings: your name, search engine, city, to-dos and
shortcuts are migrated the first time v2 runs, and every v1 city becomes a world
clock. v2 also asks for **less** than v1 did — v1 required bookmark access up
front, and here it is optional.

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

A widget is a workspace package. The catalog builds itself from the folders in
`packages/`, so adding one means dropping it in and rebuilding — there is no
registry to edit:

```
packages/widget-my-widget/
  package.json    name + version
  manifest.js     name, sizes, options, permissions
  Widget.jsx      the component
```

The full contract — every manifest field, the props a widget receives, and where
to keep its data — is in [`packages/sdk/README.md`](./packages/sdk/README.md).

**Widgets ship with the extension.** Chrome extensions may not execute code they
fetched at runtime, so there is no way to install a widget into a published build
— a new or updated widget means a new extension version in the Web Store. The
package boundary is still worth having: a widget can live in its own repository
and be vendored in or added as a workspace dependency, and the host does not
change either way. What it cannot do is arrive on its own after publishing.

## Repository layout

- `main` branch (default) — v1's source, plus the hosted privacy policies.
- `v1` branch — frozen archive of the released v1.1.0.
- `v2` branch — this rebuild.
- `packages/` — the sdk and one workspace per widget.
- `src/` — the host: board, store, settings, design tokens.
- `store-assets/` — the Web Store listing images and `SUBMISSION.md`.
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
