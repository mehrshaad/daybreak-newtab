# Chrome Web Store — publishing Daybreak 2.2.0

This goes out as **a new version of the existing listing**, not a new item. Open
the current *Daybreak - New Tab* item in the developer dashboard and upload a new
package; the item id, URL, installs, ratings and reviews all stay.

The live listing:
<https://chromewebstore.google.com/detail/daybreak-new-tab/dafdnkndnlfjbipbghigjibbpejfcnen>

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
Compress-Archive -Path dist\* -DestinationPath store-assets\daybreak-newtab-v2.2.0.zip -Force
```

The zip is git-ignored — rebuild it whenever `dist/` changes. The store rejects an
archive whose `manifest.json` is nested inside a folder.

## What the reviewer will see change

| | 2.1.0 (live) | 2.2.0 (this upload) |
| --- | --- | --- |
| Name | Daybreak - New Tab | unchanged |
| Required permissions | `storage` | unchanged |
| Optional permissions | `sessions`, `tabs`, `history`, `bookmarks`, `favicon` | + **`topSites`** |
| Host permissions | none | none |
| Optional host permissions | `https://*/*` | unchanged |
| Remote code | none | none |
| Minimum Chrome | 117 | unchanged |

**Required permissions are unchanged**, so this update installs silently for
existing users — no re-enable prompt. One thing is new for the reviewer to
notice:

- **`topSites`** (optional) — the Top Sites widget shows the sites you visit
  most, using the list Chrome has already compiled for its own new tab page.
  Requested only when that widget is added to the board, and only then; the
  widget shows a single "Allow" button until it is granted, and works not at
  all without it rather than degrading to something else. Titles and addresses
  are read to draw the tiles and nothing is stored or sent. Covered in
  `privacy-policy.html`.

Carried over from 2.1.0 and unchanged, repeated here because the reviewer
seeing this upload may not have seen the last one:

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
> TWENTY-TWO WIDGETS
> Clock (digital or analog) · World Clocks · Weather · Air quality · Tasks ·
> Quick Links · Google Apps · Most visited · Scratchpad · Focus Timer · Habits ·
> Countdown · Currency · Crypto · On this day · News · Calendar · Prayer times ·
> Moon phase · Sun & daylight · Quote of the day · Recent Tabs
>
> MADE YOURS
> Dark and light themes, or follow your system. Fifteen accent colours, twelve
> generated backgrounds, a colour per widget, adjustable tile opacity, corner
> radius and page zoom. Frosted glass, or solid surfaces if you prefer.
>
> UP TO THREE BOARDS
> Keep work and home apart. Each profile has its own layout, its own look and
> its own widget settings, and each syncs on its own.
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

> A guided tour, up to three separate boards, and a lot of polish found by
> measuring rather than by looking.
>
> - New: a guided tour on first run — fifteen steps that open each drawer for
>   real as they explain it, and stay out of your way otherwise
> - New: profiles. Up to three boards on one install, each with its own
>   layout, look and widget settings, each syncing on its own. A switcher
>   appears in the toolbar once you have more than one
> - New widgets: Countdown, Prayer times, Moon phase, Sun & daylight and Most
>   visited, bringing it to twenty-two
> - The calendar is a calendar now: a real month grid with the Jalali and
>   Hijri dates, holidays, and your events on the day they fall
> - A colour per widget, so a full board can be read at a glance. Fifteen
>   accents, and the near-duplicate swatches are gone
> - Size options: five for the digital clock, three for the icon grids, two for
>   World Clocks and Currency — and the icons themselves are larger, with the
>   padding around them cut back
> - When a widget goes wrong it now says what went wrong, and offers a button
>   that opens a GitHub issue with the error, the version and the browser
>   already filled in. Nothing from your board, your settings or your widgets
>   goes with it
> - Quick Links: 233 brand marks built in, and a link falling back to its own
>   favicon now sits on a gradient rather than a flat square
> - Blur is off by default so the page opens instantly; the welcome card asks
>   which you would rather have, and macOS starts on the frosted look where it
>   is close to free
> - Fixes: a date one day early between January and Nowruz in the Jalali
>   calendar, a tooltip that could stay behind after the pointer left the
>   window, the board not centring when a row was short, the toolbar drawing
>   over itself with a drawer open, and the analog clock swallowing its own
>   drag handle and right-click

## Images

| Asset | File |
| --- | --- |
| Store icon (128x128) | `store-icon-128.png` — the mark at 96x96 with the transparent padding the image guidelines ask for. Not `public/icon-128.png`, which is full-bleed for Chrome's own surfaces. |
| Screenshot 1 (1280x800) | `screenshot-1.png` — the board |
| Screenshot 2 (1280x800) | `screenshot-2.png` — widgets in use |
| Screenshot 3 (1280x800) | `screenshot-3.png` — layout mode, mid-drag |
| Screenshot 4 (1280x800) | `screenshot-4.png` — the widget browser |
| Screenshot 5 (1280x800) | `screenshot-5.png` — one board split down the middle, dark on the left and light on the right, built by the generator from `raw/5-dark.jpg` and `raw/5-light.jpg` |

Five is the store's maximum, so each card has to carry its own idea — no two
show the same theme, accent, background or name.
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
- **topSites** (optional) — Powers the Most visited widget, which shows the
  sites the user visits most as shortcuts, using the list Chrome has already
  compiled for its own new tab page. Requested only when that widget is added
  to the board; until it is granted the widget shows a single Allow button and
  nothing else. Titles and addresses are read to draw the tiles, nothing is
  stored and nothing is sent.
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
- [ ] `manifest.json` name reads `Daybreak - New Tab` and version `2.2.0`
- [ ] loaded the built `dist/` unpacked once, over a 2.1.0 profile, and
      confirmed existing settings, board layout and widget content are intact
- [ ] store icon, five screenshots, the small promo tile and the marquee
      uploaded. **The five on file are from 2026-08-09 and predate the tour,
      profiles, the rebuilt calendar, the new accent palette and the larger
      icon grids — they need re-capturing.** See "Re-capturing the screenshots"
      below.
- [ ] release notes filled in
- [ ] every permission justification filled in, including `favicon` and the
      optional host permission

## Re-capturing the screenshots

The five on file were captured on 2026-08-09 against 2.1.0 and are stale in ways
a reviewer will not notice but a visitor will: no tour, no profile chip in the
toolbar, the old agenda-style calendar, sixteen accent swatches in two rows of
eight rather than fifteen in three rows of five, smaller icons in Quick Links
and Google Apps, and a grid glyph on Edit layout where there is now a pencil.

They also all show the same board, in the same colour, five times — which
quietly tells a visitor that is all it does. The five are a sequence now, not
five goes at the same picture: want it, trust it can do the job, see it become
yours, see it fit your life, see it will not fight your taste.

### The boards are files

```powershell
node scripts/screenshot-boards.mjs
```

Writes five importable backups to `store-assets/boards/`. Each is a complete
board — layout, sizes, theme, accent, background, per-widget colours, and the
widget content — so capturing is import, wait, shoot. They are deliberately
unalike:

| Shot | Board | Theme | Accent | Background | Shows |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot-1-hero.json` | light | orange | Aurora | 10 widgets, arranged, analog clock |
| 2 | `shot-2-store.json` | dark | indigo | Nebula | the Store open over a full board |
| 3 | `shot-3-colours.json` | light | mint | Prism | 12 tiles, a different colour on each |
| 4 | `shot-4-profiles.json` | light | blue | Halo | the work board, with the profile switcher open |
| 5 | `shot-5-themes.json` | dark → light | magenta | Mesh | the same board under both themes |

Each carries `tourDone: true`, or the welcome card sits over the middle of every
shot.

### Capturing

1. Build and load `dist/` unpacked, or run the dev server. Set the window to
   1280 wide or more — the cards inset the capture at its own resolution rather
   than stretching it, so a bigger window is a sharper card.
2. For each shot: Settings → Backup → Import, pick the board, then give the
   live widgets a few seconds. Weather, air quality, currency, crypto and news
   all fetch, and a half-loaded tile in a store screenshot looks like a broken
   one.
3. Capture as JPEG into a scratch folder, named `1.jpg` .. `4.jpg` plus
   `5-dark.jpg` and `5-light.jpg`.
   - Shot 2: open the Store and pick a category before capturing.
   - Shot 4: add a second profile first — Settings → Profiles → Add, name them
     Work and Home — then open the switcher in the toolbar and capture with the
     menu showing. A backup cannot carry this: profiles live outside the
     per-profile storage a backup covers.
   - Shot 5: capture `5-dark.jpg`, switch the theme in the toolbar, capture
     `5-light.jpg`. Same board, same arrangement, ideally the same minute.
4. Then:

```powershell
node scripts/store-assets.mjs <that-folder>
```

   Outputs land in `store-assets/`: `screenshot-1.png` .. `screenshot-5.png` at
   1280x800, plus the promo tile and the marquee.

### A few things that make the difference

- **Let the data land.** The single most common bad store screenshot is a
  spinner or an empty state. Weather with no city reads "Pick a city to start",
  which is a photograph of the setup screen.
- **Keep the greeting.** "Good morning, Sam" over an arranged board is the whole
  pitch in one line. The boards set a name for this reason.
- **Do not stage the impossible.** Everything in these boards is something a
  user can have. A screenshot that cannot be reproduced is a promise that gets
  reported as a bug.

The captions live in `CARDS` in `scripts/store-assets.mjs`. The widget and
accent counts in them are checked against the packages and the palette by
`src/core/docsMatchWidgets.test.js` — they had both been wrong for two releases.

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
