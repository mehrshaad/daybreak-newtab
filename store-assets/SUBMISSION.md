# Chrome Web Store submission — Daybreak v2

Everything the listing form asks for, ready to paste. **v2 is a new item, not an
update to v1** — create a fresh item in the developer dashboard so the two can be
installed side by side and v1's listing is left alone.

## The package

```bash
npm ci
npm run lint && npm test
npm run build
```

Then zip the **contents** of `dist/` so `manifest.json` sits at the root of the
archive:

```powershell
Compress-Archive -Path dist\* -DestinationPath daybreak-v2-2.0.0.zip -Force
```

That writes `store-assets/daybreak-v2-2.0.0.zip`, which is git-ignored — rebuild
it whenever `dist/` changes. The store rejects a zip whose `manifest.json` is
nested inside a folder.

## Listing fields

| Field | Value |
| --- | --- |
| Item name | `Daybreak v2 - New Tab` |
| Short description (132 max) | `Start every tab fresh: a customizable widget dashboard with a clock, weather, tasks, quick links, and more.` |
| Category | Workflow & Planning |
| Language | English (United States) |
| Website / homepage | `https://github.com/mehrshaad/daybreak-newtab` |
| Support | `https://github.com/mehrshaad/daybreak-newtab/issues` |
| Privacy policy URL | `https://ali-dadashzadeh.ir/daybreak-newtab/privacy-policy-v2.html` |

Publish `privacy-policy-v2.html` to that URL **before** submitting; review fails
on a 404. v1's `privacy-policy.html` must stay where it is — it is the URL on the
live v1 listing.

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

## Images

| Asset | File |
| --- | --- |
| Screenshot 1 (1280x800) | `screenshot-1.png` — the board |
| Screenshot 2 (1280x800) | `screenshot-2.png` — widgets in use |
| Screenshot 3 (1280x800) | `screenshot-3.png` — layout mode |
| Screenshot 4 (1280x800) | `screenshot-4.png` — the widget browser |
| Screenshot 5 (1280x800) | `screenshot-5.png` — themes and backgrounds |
| Small promo tile (440x280) | `promo-tile-440x280.png` |

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
- **bookmarks** (optional) — Lets the bookmark panel and the search box show the
  user's bookmarks. Read-only; the extension never creates, edits or deletes a
  bookmark. Requested only when that feature is used.
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

- [ ] `privacy-policy-v2.html` is live at the URL above
- [ ] the zip's `manifest.json` is at the archive root
- [ ] `manifest.json` name reads `Daybreak v2 - New Tab` and version `2.0.0`
- [ ] loaded the built `dist/` unpacked once and opened a new tab
- [ ] five screenshots and the promo tile uploaded
- [ ] every permission has a justification filled in

New-tab overrides get a closer look than most extensions, and a first review can
take several days. Nothing in the package needs a review exception: no remote
code, no host permissions, one required permission.
