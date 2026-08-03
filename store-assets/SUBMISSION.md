# Chrome Web Store — publishing Daybreak 2.0.0

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
Compress-Archive -Path dist\* -DestinationPath store-assets\daybreak-v2-2.0.0.zip -Force
```

The zip is git-ignored — rebuild it whenever `dist/` changes. The store rejects an
archive whose `manifest.json` is nested inside a folder.

## What the reviewer will see change

| | v1.1.0 (live) | 2.0.0 (this upload) |
| --- | --- | --- |
| Name | Daybreak - New Tab | unchanged |
| Required permissions | `storage`, `bookmarks` | **`storage` only** |
| Optional permissions | none | `sessions`, `tabs`, `history`, `bookmarks` |
| Host permissions | none | none |
| Remote code | none | none |
| Minimum Chrome | unset | 117 |

**Required permissions go down.** Chrome only disables an extension pending user
re-approval when required permissions increase, so this update installs silently
for existing users — no re-enable prompt. Bookmark access, which v1 demanded up
front, is now requested only if the user turns the bookmarks feature on.

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
`privacy-policy.html` in this repo now describes 2.0.0, including the four
optional permissions. Push it live before submitting: a policy that does not match
the manifest is a common rejection.

### Detailed description

> Daybreak replaces Chrome's new tab page with a board you arrange yourself.
>
> Put a clock, the weather, your to-do list, your links and your habits where you
> want them. Drag tiles around, cycle their sizes, and keep only what you use —
> or start from one of four layout presets and save your own.
>
> ELEVEN WIDGETS
> Clock (digital or analog) · World Clocks · Weather · Tasks · Quick Links ·
> Google Apps · Scratchpad · Focus Timer · Habits · Quote of the day ·
> Recent Tabs
>
> MADE YOURS
> Dark and light themes, or follow your system. Six accent colours, eight
> generated backgrounds, adjustable tile opacity, corner radius and page zoom.
> Frosted glass, or solid surfaces if you prefer.
>
> QUIET BY DEFAULT
> No accounts, no analytics, no ads, no tracking. Your board is saved with
> Chrome's own sync storage and follows your profile; notes and habit history
> stay on the device. Everything runs offline except the weather and the search
> box.
>
> Export your whole setup to a file and import it back whenever you like.

### What's new (release notes)

> A complete rebuild. Daybreak is now a board of widgets you arrange yourself
> rather than a fixed layout.
>
> - Eleven widgets, including world clocks, habits, a focus timer and an analog
>   clock face
> - Drag tiles anywhere, resize them, save your own layout
> - A widget browser for adding and removing
> - Dark, light or system themes, six accents, eight generated backgrounds
> - Needs less than before: bookmark access is now optional instead of required
> - Your name, search engine, city, to-dos and shortcuts carry over from v1

## Images

| Asset | File |
| --- | --- |
| Store icon (128x128) | `store-icon-128.png` — the mark at 96x96 with the transparent padding the image guidelines ask for. Not `public/icon-128.png`, which is full-bleed for Chrome's own surfaces. |
| Screenshot 1 (1280x800) | `screenshot-1.png` — the board |
| Screenshot 2 (1280x800) | `screenshot-2.png` — widgets in use |
| Screenshot 3 (1280x800) | `screenshot-3.png` — layout mode |
| Screenshot 4 (1280x800) | `screenshot-4.png` — the widget browser |
| Screenshot 5 (1280x800) | `screenshot-5.png` — themes and backgrounds |
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
- **Remote code** — No. All code is bundled in the package; nothing is fetched
  and executed at runtime.

**Data collection disclosures.** Tick nothing except what applies:

- The extension does **not** collect or transmit personally identifiable
  information, health, financial, authentication, personal communications,
  location, web history or user activity to the developer or anyone else.
- Confirm all three certification checkboxes: no selling data to third parties,
  no use for unrelated purposes, no use to determine creditworthiness.

The city a user picks is sent to Open-Meteo to fetch weather, and search queries
go to the engine the user chose. Both are described in the privacy policy; both
are the user's own action and neither reaches the developer, who operates no
server.

## Before you hit submit

- [ ] the updated `privacy-policy.html` is live at the URL on the listing
- [ ] the zip's `manifest.json` is at the archive root
- [ ] `manifest.json` name reads `Daybreak - New Tab` and version `2.0.0`
- [ ] loaded the built `dist/` unpacked once, over v1 storage, and checked the
      migration (see below)
- [ ] store icon, five screenshots, the small promo tile and the marquee uploaded
- [ ] release notes filled in
- [ ] every permission justification filled in, including the four optional ones

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
