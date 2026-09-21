# Chrome Web Store — publishing Daybreak 2.4.0

> **Ready to upload.** 2.3.0 went up on 7 September 2026; this is the next one.
> Everything below is ready to paste, and the checklist at the end is what is
> left to do by hand.

This goes out as **a new version of the existing listing**, not a new item: open
the *Daybreak - New Tab* item in the developer dashboard and upload a new
package, so the item id, URL, installs, ratings and reviews all stay.

The live listing:
<https://chromewebstore.google.com/detail/daybreak-new-tab/dafdnkndnlfjbipbghigjibbpejfcnen>

## The package

```bash
npm ci
npm run lint && npm test
npm run build
```

Then zip the **contents** of `dist/` so `manifest.json` sits at the root of the
archive:

```powershell
Compress-Archive -Path dist\* -DestinationPath store-assets\daybreak-newtab-v2.4.0.zip -Force
```

The zip is git-ignored — rebuild it whenever `dist/` changes. The store rejects an
archive whose `manifest.json` is nested inside a folder.

## What the reviewer will see change

| | 2.3.0 (live) | 2.4.0 (this upload) |
| --- | --- | --- |
| Name | Daybreak - New Tab | unchanged |
| Required permissions | `storage` | unchanged |
| Optional permissions | `sessions`, `tabs`, `history`, `bookmarks`, `favicon`, `topSites`, `clipboardRead` | unchanged |
| Host permissions | none | none |
| Optional host permissions | `https://*/*` | unchanged |
| Remote code | none | none |
| Minimum Chrome | 117 | unchanged |

**Nothing in the manifest changed at all** — verified with
`git diff v2.3.0..v2 -- public/manifest.json`, which is empty. No new
permission is requested, so this update installs silently for existing users
and there is no re-enable prompt.

One thing is new that a reviewer should know about even though it needs no
permission:

- **The News widget can show thumbnails, and they are off by default.** A
  thumbnail is an `<img>` pointing at whichever host the feed names for it,
  usually the publisher's own CDN, which means turning the option on makes
  requests to third-party servers on every new tab. No host permission is
  involved — an extension page's default CSP does not restrict `img-src` — so
  nothing in the manifest says this, which is exactly why it is called out
  here. It ships off, the option's own copy says what it does, images are sent
  with `referrerpolicy="no-referrer"`, and `privacy-policy.html` has a
  paragraph on it.

Carried over and unchanged, repeated here because the reviewer seeing this
upload may not have seen the last one:

- **`bookmarks`** (optional) — the Bookmarks widget reads Chrome's own bookmark
  tree and edits it: add, rename, move and delete, from the widget's settings
  or by right-clicking a bookmark on the board. Those edits are made in
  Chrome's bookmarks deliberately — the widget shows and edits the one list the
  browser already keeps rather than a private copy. Deleting asks twice.
  Nothing is uploaded. Also used for search suggestions.
- **`clipboardRead`** (optional) — when the user adds a Quick Link, the address
  they just copied is offered in the address field. Read only while that form
  is open, used only to fill that field, never stored or sent. Asked once ever:
  on the welcome card at setup, or on the first Quick Link added by somebody
  who skipped it. Never at install. There is a switch for it in Settings.
- **`topSites`** (optional) — the Most visited widget, from the list Chrome has
  already compiled for its own new tab page. Requested only when that widget is
  added.
- **`favicon`** (optional) — a page's real icon next to a search suggestion,
  read from Chrome's already-cached favicon store rather than by making a
  request to the site. Requested alongside whichever suggestion source the user
  turns on first; never on its own.
- **`sessions`, `tabs`, `history`** (optional) — Recent Tabs, and the search
  box's suggestion sources. Each requested only when switched on.
- **`optional_host_permissions: ["https://*/*"]`** — grants nothing by itself.
  It is the pattern Chrome requires a per-origin
  `chrome.permissions.request()` to fall within, used by the Calendar and News
  widgets to ask for access to exactly one address (an iCal link or a feed URL)
  the user pastes in, at the moment they provide it. No standing access to any
  site.

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

The policy URL is unchanged, but **the file behind it is republished every
time it changes** — a policy that does not match the manifest is a common
rejection. `privacy-policy.html` in this repo covers all seven optional
permissions, the per-origin host permission, and every widget that talks to its
own provider (Open-Meteo, Frankfurter, the exchange-rate fallback, CoinGecko,
Wikipedia, Hacker News, and a calendar address a user supplies). It is stamped
`reviewed for version 2.3.0`, and a test holds that stamp to `package.json` so
the next bump cannot ship without somebody reading the policy again.

### Detailed description

> Daybreak replaces Chrome's new tab page with a board you arrange yourself.
>
> Put a clock, the weather, your to-do list, your links and your habits where you
> want them. Drag tiles around, cycle their sizes, and keep only what you use —
> or start from one of four layout presets and save your own.
>
> TWENTY-THREE WIDGETS
> Clock (digital or analog) · World Clocks · Weather · Air quality · Tasks ·
> Quick Links · Google Apps · Most visited · Scratchpad · Focus Timer · Habits ·
> Countdown · Currency · Crypto · On this day · News · Calendar · Prayer times ·
> Moon phase · Sun & daylight · Quote of the day · Recent Tabs · Bookmarks
>
> MADE YOURS
> Dark and light themes, follow your system, or follow the sun. Sixteen accent colours, twelve
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

> Weather in five cities, pictures and previews in the news, and a popup bug
> that closed the settings drawer out from under whatever you were typing in.
>
> - Weather holds up to five cities and shows one or two side by side, with the
>   rest behind a button in the corner. Each has its own reading
> - The temperature grows into the room it has: turn the forecast off on a
>   small tile and the number fills it instead of sitting in an empty card
> - News shows a picture and a summary, and resting on a headline for a second
>   opens a preview. Pictures are off by default — they are loaded from the
>   publisher's own server, so that is your choice to make
> - Right-click a bookmark for its name, address and colour, the same way Quick
>   Links already worked. Renaming here renames it in Chrome
> - The focus timer takes real lengths now: the round from 5 to 60 minutes, the
>   break from 1 to 30, and the long break separately
> - Start typing anywhere on the board and it goes to the search box, the way
>   Chrome's own new tab does
> - Replaying the tour gets a board of its own, so it no longer rearranges the
>   one you have set up
> - There is a face and a name behind this now, in Settings, with a way to
>   reach me
> - World Clocks fits a 2x2. Icons lift when you hover them, and the one whose
>   editor is open lifts further so you can see which it is
> - Fixed: a popup opened from the settings drawer closed the drawer out from
>   under it, so picking a city, a date or a colour meant starting again — and
>   the link editor could not be typed into at all
> - Fixed: reaching for a widget's scrollbar put the board into edit mode
> - Fixed: the sun in Sun & daylight was an ellipse at most tile sizes
> - Fixed: the search-engine menu was unreadable, with the board showing
>   through the engine names
> - Fixed: the folder list in Quick Links and Bookmarks pushed every other
>   setting below the fold; it is at the bottom now
> - Fixed: hovering a row in a list barely changed it in the light theme
>
> Everything below is from 2.3.0 and still true.
>
> Your bookmarks on the new tab page, folders you can pull apart into their own
> cards, and a theme that follows the sun.
>
> - New widget: Bookmarks. Your browser's own folders, read live from Chrome
>   and edited there too. Twenty-three widgets now
> - Folders, for Bookmarks and for Quick Links, and either can be pulled apart
>   so each folder becomes its own card to arrange and resize
> - New theme: Sunrise. Light by day and dark after sunset, worked out on the
>   device from a city you have already set in a widget, or from your timezone
> - Right-click a Quick Link to edit it: name, address, tile colour, icon
>   colour, remove
> - Adding is in the right-click menu now, for all nine widgets you can add
>   something to
> - Quick Links and Google Apps can be a list instead of a grid
> - The focus timer puts its countdown in the tab title while it runs
> - Fixed: every floating surface was positioned in the wrong units under a
>   page zoom, so tooltips, popovers and the context menu all landed off by the
>   zoom

## Images

| Asset | File |
| --- | --- |
| Store icon (128x128) | `store-icon-128.png` — the mark at 96x96 with the transparent padding the image guidelines ask for. Not `public/icon-128.png`, which is full-bleed for Chrome's own surfaces. |
| Screenshot 1 (1280x800) | `screenshot-1.png` — the hero board, arranged, on a warm light theme |
| Screenshot 2 (1280x800) | `screenshot-2.png` — the widget Store open over a full dark board |
| Screenshot 3 (1280x800) | `screenshot-3.png` — a different colour on each of twelve tiles |
| Screenshot 4 (1280x800) | `screenshot-4.png` — the work board with the profile switcher open |
| Screenshot 5 (1280x800) | `screenshot-5.png` — one board split down the middle, dark on the left and light on the right, built by the generator from `raw/5-dark.jpg` and `raw/5-light.jpg` |
| Small promo tile (440x280) | `promo-tile-440x280.png` |
| Marquee promo tile (1400x560) | `marquee-1400x560.png` — only used if the store features the item |

Five is the store's maximum, so each card has to carry its own idea — no two
show the same theme, accent, background or name.

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
- **bookmarks** (optional) — Two features use it. The search box suggests the
  user's saved bookmarks, matched against what they type. The Bookmarks widget
  shows their bookmark folders on the new tab page, and lets them add, rename,
  move and delete bookmarks and folders from the widget's own settings — those
  edits are made in Chrome's bookmarks, which is the point: the widget shows
  and edits the one list the browser already keeps rather than a private copy
  of it. Deleting anything asks for a second confirming tap. Nothing is
  uploaded or sent anywhere. Requested only when the widget is added or the
  suggestion source is switched on, never at install.
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
- **clipboardRead** (optional) — When the user adds a Quick Link, the address
  they have just copied is offered in the address field, so they do not have to
  paste it by hand. Read at the moment the add form is open and used only to
  fill that one field; nothing from the clipboard is stored or sent anywhere.
  Requested the first time the user presses "Paste what I copied", never at
  install, and revocable in Chrome's own permission list.
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

Ticked by me, in the repo:

- [x] `package.json` and `public/manifest.json` both read `2.4.0`, guarded by
      a test
- [x] every widget whose code changed has a bumped manifest version — seven of
      them. Nothing forces this, and it had been missed for the whole of
      2.3.0, so it is a line on this list now
- [x] `privacy-policy.html` re-read rather than re-stamped. Two claims in it
      had gone stale: it named a "Paste what I copied" button that no longer
      exists, and said bookmarks are edited from the widget's settings when
      they are now also edited from the board. Both corrected, and the news
      thumbnail option is disclosed
- [x] nothing in `public/manifest.json` changed — `git diff v2.3.0..v2 --
      public/manifest.json` is empty — so no new permission and a silent
      update for existing users
- [x] lint, 1600+ tests and the build all pass
- [x] the zip is built with `manifest.json` at the archive root, no source maps

Left for you:

- [ ] publish the updated `privacy-policy.html` to the URL on the listing
      **before** uploading. The policy is stamped `reviewed for version 2.4.0`
- [ ] load the built `dist/` unpacked once and check two things the dev server
      cannot: that the **Bookmarks widget** reads and edits Chrome's real tree,
      and that a **news thumbnail actually loads** with the option on. An
      extension page's default CSP does not restrict `img-src`, so it should —
      but that is reasoning, not a measurement, and it is thirty seconds to
      confirm
- [ ] store icon, five screenshots, the small promo tile and the marquee.
      **The five in this folder are still the 2026-08-09 files** and have never
      been re-captured; whatever went up for 2.3.0 was not mirrored back here.
      See "Re-capturing the screenshots"
- [ ] paste the release notes below into the dashboard
- [ ] the listing's detailed description is a listing field, not part of the
      package, so it can be edited any time

## Re-capturing the screenshots

The five on file were captured on 2026-08-09 against 2.1.0 and are stale in ways
a reviewer will not notice but a visitor will: no tour, no profile chip in the
toolbar, the old agenda-style calendar, sixteen accent swatches in two rows of
eight rather than fifteen in three rows of five, smaller icons in Quick Links
and Google Apps, and a grid glyph on Edit layout where there is now a pencil.
Two releases on, they also show none of what 2.3.0 leads with: no Bookmarks
widget, no folder cards, no Sunrise theme in the appearance row.

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
| 1 | `shot-1-hero.json` | light | orange | Aurora | 10 widgets, arranged, analog clock, Bookmarks |
| 2 | `shot-2-store.json` | dark | indigo | Nebula | the Store open over a full board |
| 3 | `shot-3-colours.json` | light | mint | Prism | 12 tiles, a different colour on each |
| 4 | `shot-4-profiles.json` | light | blue | Halo | the work board, Bookmarks, profile switcher open |
| 5 | `shot-5-themes.json` | dark → light | magenta | Mesh | the same board under both themes |

Each carries `tourDone: true`, or the welcome card sits over the middle of every
shot.

### Capturing

1. Build and load `dist/` **unpacked** — not the dev server, for these five.
   Shots 1 and 4 carry the Bookmarks widget, and Chrome's bookmarks are
   unreachable from a plain page: on the dev server both tiles read "available
   in the installed extension", which is a photograph of an error message.
   Set the window to 1280 wide or more — the cards inset the capture at its own
   resolution rather than stretching it, so a bigger window is a sharper card.
2. For each shot: Settings → Backup → Import, pick the board, then give the
   live widgets a few seconds. Weather, air quality, currency, crypto and news
   all fetch, and a half-loaded tile in a store screenshot looks like a broken
   one.
3. Capture as JPEG into a scratch folder, named `1.jpg` .. `4.jpg` plus
   `5-dark.jpg` and `5-light.jpg`.
   - Shots 1 and 4: grant the bookmarks permission when the widget asks, and
     make sure Chrome has a few bookmarks in named folders — a backup cannot
     carry these, because they are the browser's and not the board's. Two or
     three folders of four or five links each photographs best; an empty
     bookmarks bar reads as a broken widget.
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
