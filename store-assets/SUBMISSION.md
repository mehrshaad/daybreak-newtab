# Chrome Web Store — publishing Daybreak 2.1.0

This goes out as **a new version of the existing listing**, not a new item. Open
the current *Daybreak - New Tab* item in the developer dashboard and upload a new
package; the item id, URL, installs, ratings and reviews all stay.

Everything below is ready to paste.

## The package

```bash
npm ci
npm run lint && npm test
npm run build
```

Then zip the **contents** of `dist/` so `manifest.json` sits at the root of the
archive:

```powershell
Compress-Archive -Path dist\* -DestinationPath store-assets\daybreak-v2-2.1.0.zip -Force
```

The zip is git-ignored — rebuild it whenever `dist/` changes. The store rejects an
archive whose `manifest.json` is nested inside a folder.

## What the reviewer will see change

| | 2.0.0 (live) | 2.1.0 (this upload) |
| --- | --- | --- |
| Name | Daybreak - New Tab | unchanged |
| Required permissions | `storage` | unchanged |
| Optional permissions | `sessions`, `tabs`, `history`, `bookmarks` | + **`favicon`** |
| Host permissions | none | none |
| Optional host permissions | none | **`https://*/*`** (see below) |
| Remote code | none | none |
| Minimum Chrome | 117 | unchanged |

**Required permissions are unchanged**, so this update installs silently for
existing users — no re-enable prompt. Two things are new for the reviewer to
notice:

- **`favicon`** (optional) — lets search suggestions show a page's real icon,
  reading Chrome's own already-cached favicon store. Requested alongside
  whichever suggestion source (tabs/history/bookmarks) the user turns on
  first; never requested on its own.
- **`optional_host_permissions: ["https://*/*"]`** — grants nothing by
  itself. It is the pattern Chrome requires a per-origin
  `chrome.permissions.request()` to fall within, used by the new Calendar and
  News widgets to ask for access to exactly one address (an iCal link or a
  feed URL) the user pastes in, at the moment they add it. No standing access
  to any site.

`minimum_chrome_version: 117` is what the animated greeting collapse
(`grid-template-rows` interpolation) and the OKLCH colour tokens need. Anyone on
an older Chrome keeps v1.1.0 rather than receiving a build that renders wrongly.

## Listing fields

Most are already set on the item. Check these:

| Field | Value |
| --- | --- |
| Item name | `Daybreak - New Tab` |
| Short description (132 max) | `Start every tab fresh: a customizable widget dashboard with a clock, weather, tasks, quick links, and more.` |
| Category | Workflow & Planning |
| Language | English (United States) |
| Website / homepage | `https://github.com/mehrshaad/daybreak-newtab` |
| Support | `https://github.com/mehrshaad/daybreak-newtab/issues` |
| Privacy policy URL | `https://ali-dadashzadeh.ir/daybreak-newtab/privacy-policy.html` |

The policy URL is unchanged, but **the file behind it has to be republished** —
`privacy-policy.html` in this repo now describes 2.1.0, including `favicon`,
the per-origin host permission, and every new widget that talks to its own
provider (Frankfurter, CoinGecko, Wikipedia, Hacker News, and the calendar
address a user supplies). Push it live before submitting: a policy that does
not match the manifest is a common rejection.

### Detailed description

> Daybreak replaces Chrome's new tab page with a board you arrange yourself.
>
> Put a clock, the weather, your to-do list, your links and your habits where you
> want them. Drag tiles around, cycle their sizes, and keep only what you use —
> or start from one of four layout presets and save your own.
>
> SEVENTEEN WIDGETS
> Clock (digital or analog) · World Clocks · Weather · Air quality · Tasks ·
> Quick Links · Google Apps · Scratchpad · Focus Timer · Habits · Currency ·
> Crypto · On this day · News · Calendar · Quote of the day · Recent Tabs
>
> MADE YOURS
> Dark and light themes, or follow your system. Six accent colours, twelve
> generated backgrounds, adjustable tile opacity, corner radius and page zoom.
> Frosted glass, or solid surfaces if you prefer.
>
> QUIET BY DEFAULT
> No accounts, no analytics, no ads, no tracking, no API keys anywhere. Your
> board is saved with Chrome's own sync storage and follows your profile. A
> handful of widgets talk to their own keyless provider — weather, air
> quality, currency, crypto, on-this-day and news each say exactly what they
> send and to whom in the privacy policy. A calendar link you paste in is
> never logged or shown again once saved.
>
> Export your whole setup to a file and import it back whenever you like.

### What's new (release notes)

> Six new widgets, a lighter drag-and-drop interaction, and search that
> actually feels like the omnibox.
>
> - New: Air quality, Currency, Crypto, On this day, News (Hacker News or your
>   own feed) and Calendar (paste a private iCal link, or several) — all
>   keyless, no account required
> - Press and hold a tile — or empty space — to enter edit mode; drag from the
>   handle that appears, no separate toggle needed first
> - Tiles and Quick Links icons can also be dragged into a new order any time,
>   without entering edit mode at all
> - Search suggestions are ranked, show real site icons, and offer "Go to
>   site" for an address you type directly — turn on tabs, bookmarks and
>   history right from the welcome card, or later in Settings
> - Habit history and Scratchpad notes now sync (when small enough) instead of
>   staying local-only
> - Habits: double-click a name to rename it, the same as tasks and world
>   clocks
> - Quick Links: name a link yourself, remove one with an edit-mode badge, and
>   hover any icon for its full name and address
> - Custom date picker for tasks, opening on today without defaulting a new
>   task's due date to it
> - Switching layout presets no longer discards your own arrangement — it is
>   saved as "Yours" automatically the first time, so it is always one click
>   away
> - Hover any icon-only control for a quick label — what it does, not just
>   what it looks like
> - Quick Links now show the real mark of the site they point at, resolved
>   from the address rather than the name — so a link you called "Work" still
>   arrives wearing its own icon. 114 brands built in, and Chrome's own cached
>   favicon for anything outside that list
> - Four more backgrounds — Prism, Lattice, Tide and Spot — and every one of
>   them now reads properly on the neutral accent instead of coming out a
>   plain page
> - Dragging a tile is smooth the whole way across the board, including
>   through a reorder, and the tile it would displace is outlined as you go
> - An open drawer no longer sits on top of the widgets on a mid-width window
> - Everything else — sliders, the search box's clear button, dropdown
>   placement — now matches the theme completely, in both light and dark

## Images

| Asset | File |
| --- | --- |
| Store icon (128x128) | `store-icon-128.png` — the mark at 96x96 with the transparent padding the image guidelines ask for. Not `public/icon-128.png`, which is full-bleed for Chrome's own surfaces. |
| Screenshot 1 (1280x800) | `screenshot-1.png` — the board |
| Screenshot 2 (1280x800) | `screenshot-2.png` — widgets in use |
| Screenshot 3 (1280x800) | `screenshot-3.png` — layout mode |
| Screenshot 4 (1280x800) | `screenshot-4.png` — the widget browser |
| Screenshot 5 (1280x800) | `screenshot-5.png` — themes and backgrounds |
| Screenshot 6 (1280x800) | `screenshot-6.png` — a board made your own |
| Small promo tile (440x280) | `promo-tile-440x280.png` |
| Marquee promo tile (1400x560) | `marquee-1400x560.png` — only used if the store features the item |

Regenerate from fresh captures with:

```bash
node scripts/store-assets.mjs store-assets/raw
```

## Privacy practices tab

**Single purpose.** Replace the browser's new tab page with a customizable
dashboard of widgets.

**Permission justifications** — paste each into the matching box:

- **storage** — Saves the user's board layout, widget settings and appearance
  preferences so the new tab page looks the same on every tab and syncs across
  the devices where they are signed in to Chrome.
- **sessions** (optional) — Powers the Recent Tabs widget, which lists recently
  closed tabs and windows so the user can reopen one. Requested only when that
  widget is added.
- **tabs** (optional) — Lets the search box suggest tabs the user already has
  open, and switch to one instead of opening a duplicate. Requested only when
  that suggestion source is switched on.
- **history** (optional) — Lets the search box suggest pages the user has visited
  before, matched against what they type. Requested only when that suggestion
  source is switched on.
- **bookmarks** (optional) — Lets the search box suggest the user's saved
  bookmarks, matched against what they type. Read-only; the extension never
  creates, edits or deletes a bookmark. Requested only when that suggestion
  source is switched on.
- **favicon** (optional) — Shows a page's real icon next to a search
  suggestion, reading Chrome's own already-cached favicon store rather than
  making a request to the site. Requested the first time the user turns on
  one of the suggestion sources above.
- **Host permissions (optional, `https://*/*` pattern)** — Used only when the
  user pastes in a private calendar address (Calendar widget) or a custom
  feed URL (News widget). Chrome's per-origin permission API requires this
  pattern in the manifest to request a single origin at runtime; the
  extension only ever asks for the one address the user just provided, at
  the moment they provide it, and never for anything broader.
- **Remote code** — No. All code is bundled in the package; nothing is fetched
  and executed at runtime.

**Data collection disclosures.** Tick nothing except what applies:

- The extension does **not** collect or transmit personally identifiable
  information, health, financial, authentication, personal communications,
  location, web history or user activity to the developer or anyone else.
- Confirm all three certification checkboxes: no selling data to third parties,
  no use for unrelated purposes, no use to determine creditworthiness.

The city a user picks is sent to Open-Meteo for weather and air quality;
currency and coin choices go to Frankfurter and CoinGecko; today's date (never
the year) goes to Wikipedia's on-this-day feed; Hacker News' API is read for
the News widget's default source, or the user's own feed URL if they switch
to one; a pasted calendar address is fetched from its own provider; and
search queries go to the engine the user chose. All of this is described in
the privacy policy; all of it is the user's own action, and none of it
reaches the developer, who operates no server.

## Before you hit submit

- [ ] the updated `privacy-policy.html` is live at the URL on the listing
- [ ] the zip's `manifest.json` is at the archive root
- [ ] `manifest.json` name reads `Daybreak - New Tab` and version `2.1.0`
- [ ] loaded the built `dist/` unpacked once, over a 2.0.0 profile, and
      confirmed existing settings, board layout and widget content are intact
- [ ] store icon, six screenshots, the small promo tile and the marquee
      uploaded — re-captured on 2026-08-09, each one on a different theme,
      accent and background so the listing shows what is adjustable
- [ ] release notes filled in
- [ ] every permission justification filled in, including `favicon` and the
      optional host permission

## Checking the migration by hand

v1's settings live under the `daybreakSettings` key. To watch the upgrade the way
a real user will:

1. Install v1.1.0, set a name, pick a city, add a to-do and a shortcut.
2. Load the 2.0.0 `dist/` over the same profile (or, unpacked, replace the
   extension keeping the same id).
3. Open a new tab. The name, search engine, city, to-dos and shortcuts should be
   there, every v1 city should appear as a world clock, and `daybreakSettings`
   should still be untouched — the migration reads it and never deletes it, so a
   downgrade is still possible.

Once an upgraded profile has written `daybreak2`, the migration is skipped
forever after; it only runs when no v2 settings exist yet.
