# Daybreak widget contract

A widget is a folder under `src/widgets/<id>/` containing a `manifest.js` and a
component. The registry (`src/widgets/registry.js`) discovers folders with
`import.meta.glob`, so **adding a widget is dropping in a folder and
rebuilding** — nothing to register by hand.

This contract is deliberately transport-agnostic. Today the manifest is a JS
module found on disk; a future release will let you install a widget from
another repo, where the same fields arrive as JSON and the component runs in a
sandboxed iframe instead of in-process. Widgets that stick to this contract
work in both worlds.

## Folder layout

```
src/widgets/clock/
  manifest.js     what the widget is, how it can be configured
  Widget.jsx      the component (default export)
```

## manifest.js

```js
export default {
  id: "clock",                    // unique; defaults to the folder name
  name: "Clock",                  // shown on the tile and in the store
  category: "Essentials",         // groups it in the store sidebar
  author: "Daybreak",
  version: "2.0.0",
  tagline: "Time and date, at a glance.",       // one line, store cards
  description: "Longer prose for the store detail page.",

  sizes: [[3, 2], [4, 2]],        // [cols, rows] on a 12-col / 96px-row grid
  defaultSize: [4, 2],            // must be one of `sizes`

  options: [                      // rendered as toggles in the settings drawer
    { key: "hour24", label: "24-hour time", type: "boolean", default: false },
  ],

  refresh: ["Live", "5 min", "1 hr"],   // null = no refresh control
  permissions: {
    chrome: ["sessions"],         // requested at install time, from a click
    hosts: ["api.open-meteo.com"],// shown on the store detail page
  },

  actions: [                      // extra items in the tile's context menu
    { label: "Add a timezone", hint: "", run: (api) => api.openSettings() },
  ],

  load: () => import("./Widget.jsx"),   // lazy; keeps widgets out of the main chunk
};
```

Only `id`/folder name, `name` and `load` are required; everything else has a
default (see `normalize()` in the registry).

## Widget.jsx

Default-export a component. It receives:

| prop | meaning |
| --- | --- |
| `id` | the widget id |
| `size` | `[cols, rows]` currently applied |
| `options` | manifest defaults merged with the user's choices |
| `config` | free-form per-widget settings (city, zones, links…) |
| `setConfig(patch)` | merge into `config`; persists to synced settings |
| `setOptions(patch)` | merge into `options` |
| `focused` | true while zoomed — render more detail if useful |
| `editing` | true in layout-edit mode; suppress internal interactions |
| `refreshKey` | increments on the widget's refresh interval; use as an effect dep |
| `toast(message)` | show the bottom pill |
| `openSettings()` | open this widget's settings drawer |

### Storing content

`config` rides in the synced settings object, which shares **one 8KB
`chrome.storage.sync` item**. Keep it to small values: a city, a list of
timezones, a handful of links.

Anything larger or high-churn — note text, habit history, cached API
responses — belongs in the local bucket:

```js
import { useWidgetLocal } from "../../sdk/bucket";

const [text, setText, ready] = useWidgetLocal("scratchpad", "text", "");
```

Bucket keys are namespaced per widget, writes are debounced, and everything a
widget stored is dropped when it is removed from the board.

### Styling

Style from the CSS custom properties on the app root — `--fg`, `--dim`,
`--faint`, `--line`, `--panel`, `--panel2`, `--accent`, `--accentSoft`,
`--accentLine`, `--onAccent`, `--danger`, `--ok`. A widget that hardcodes
colours will look wrong in the other theme and against every accent.

The tile draws its own frame, padding and header (mark + name + controls); a
widget renders only its body and should let itself grow with
`flex: 1`.

### Rules

- No network calls except to hosts declared in `permissions.hosts`.
- Feature-detect Chrome APIs (`typeof chrome !== "undefined" && chrome.sessions`)
  — widgets must degrade gracefully when run as a plain page via `npm run dev`.
- Never write to `localStorage` directly; use the bucket so storage stays
  namespaced and exportable via backup/restore.
