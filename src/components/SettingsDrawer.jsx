import { useRef, useState } from "react";
import { LuMonitor, LuMoon, LuSun, LuSunrise } from "react-icons/lu";
import {
  backupFilename,
  download,
  exportBackup,
  parseBackup,
  restoreBuckets,
} from "../core/backup";
import { CrossfadeFill, dropPermission, MONO, requestAllPermissions, sunTimes } from "@daybreak/sdk";
import {
  ACCENT_COLUMNS,
  ACCENT_NAMES,
  ACCENTS,
  PAGE_ZOOM_MAX,
  PAGE_ZOOM_MIN,
  WALLPAPERS,
  backgroundSwatch,
} from "../core/tokens";
import { CATEGORIES, CATEGORY_LABELS } from "../core/notices";
import { SOURCES } from "../core/suggest";
import { boardWidthChoices, useViewportWidth } from "../core/useColumns";
import { systemTheme } from "../core/useSystemTheme";
import { sunLocation } from "../core/sunTheme";
import {
  Button,
  Collapse,
  Drawer,
  DrawerHeader,
  Pill,
  Section,
  Slider,
  Toggle,
} from "./primitives";
import AboutSection from "./AboutSection";
import ProfilesSection from "./ProfilesSection";

const BOARD_WIDTH_LABELS = { comfortable: "Comfortable", wide: "Wide", full: "Full" };

// What the sunrise theme is actually going to use, said out loud.
//
// Because the answer changes with the board, and a setting whose behaviour
// depends on another widget's configuration has to say so — otherwise "it
// switched at the wrong time" has no explanation anywhere in the app. It also
// tells somebody exactly how to make it exact, which is the only thing they
// can do about it.
function sunThemeNote(widgets) {
  const place = sunLocation(widgets);
  if (!place) {
    return "Your browser is not telling us your timezone, so this follows your system setting. Set a city in the Weather widget to fix it.";
  }
  const marks = sunTimes(new Date(), place.latitude, place.longitude);
  const at = (t) =>
    t ? t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";
  if (!marks.sunrise || !marks.sunset) {
    return "The sun neither rises nor sets where you are today, so this follows your system setting until it does.";
  }
  const today = `Light from ${at(marks.sunrise)} to ${at(marks.sunset)} today.`;
  return place.exact
    ? `${today} Using ${place.name}, from your weather widget.`
    : `${today} Estimated from your timezone — set a city in the Weather widget to make it exact.`;
}


function SettingsDrawer({
  open,
  settings,
  theme,
  update,
  onClose,
  onReset,
  onRestore,
  onTour,
  toast,
}) {
  const { appearance, behavior, profile, widgets } = settings;
  const viewport = useViewportWidth();
  const widthChoices = boardWidthChoices(viewport, appearance.boardWidth || "comfortable");
  const suggest = behavior.suggest || { links: true };
  const notices = behavior.notifications || { enabled: true, categories: {} };
  const fileRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const { data, error } = parseBackup(await file.text());
    if (error) {
      toast(error);
      return;
    }
    await restoreBuckets(data.buckets);
    onRestore(data.settings);
    toast("Backup restored");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={400}
      label="Settings"
      header={<DrawerHeader title="Settings" onClose={onClose} />}
    >

      <Section title="Appearance" data-tour="settings-appearance" style={{ marginBottom: 20 }}>
        {/* Four now, so they wrap two by two rather than being squeezed into
            one row of quarter-width pills. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 6,
          }}
        >
          {/* The same four marks the toolbar's theme button cycles through,
              so the row and the button cannot disagree about which state is
              which. Sunrise is a sun over a horizon rather than the plain sun
              that means Light: two states both mean daylight, and one glyph
              for both would make the pair unreadable. */}
          {[
            ["system", "System", LuMonitor],
            ["sun", "Sunrise", LuSunrise],
            ["light", "Light", LuSun],
            ["dark", "Dark", LuMoon],
          ].map(([value, label, Icon]) => (
            <Pill
              key={value}
              active={(appearance.theme || "system") === value}
              onClick={() => update("appearance", { theme: value })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: 10,
              }}
            >
              <Icon size={14} aria-hidden />
              {label}
            </Pill>
          ))}
        </div>
        <Collapse open={(appearance.theme || "system") === "system"}>
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8 }}>
            Following your {systemTheme()} browser setting.
          </div>
        </Collapse>
        <Collapse open={(appearance.theme || "system") === "sun"}>
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
            {sunThemeNote(widgets)}
          </div>
        </Collapse>
      </Section>

      <Section title="Accent" data-tour="settings-accent" style={{ marginBottom: 22 }}>
        {/* Fifteen swatches, and the row length is chosen so they come out the
            size of a swatch rather than the size of a button.
            
            This was five to a row for one release, which is three clean rows of
            fifteen — and at a 400px drawer that made each one 60px across.
            Reported, fairly, as "the accent colours are huge in settings": a
            colour swatch is a sample, and a 60px circle reads as something you
            are meant to press rather than something you are meant to compare.
            
            Eight and seven is one cell short of even, which is why it was
            changed away from — but a nearly-even pair of rows of 30px samples
            looks far more like a palette than three rows of discs. auto-fit
            with a max keeps them sample-sized whatever the drawer does. */}
        <div
          role="group"
          aria-label="Accent colour"
          // Eight fixed columns against sixteen accents, so it is always two
          // full rows. `auto-fit` asked the browser how many fitted and
          // answered eight for a palette of fifteen, which left the second row
          // seven long with a hole on the end — and the answer changed with the
          // drawer's width, so the hole moved about.
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${ACCENT_COLUMNS}, 1fr)`,
            justifyItems: "center",
            gap: 8,
          }}
        >
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent: ${ACCENT_NAMES[c] || c}`}
              aria-pressed={appearance.accent === c}
              onClick={() => update("appearance", { accent: c })}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 999,
                cursor: "pointer",
                background: c,
                border: 0,
                padding: 0,
                boxShadow:
                  appearance.accent === c
                    ? `0 0 0 2px var(--sheet), 0 0 0 4px ${c}`
                    : "none",
                // The ring lands on the chosen one rather than snapping, and
                // an unchosen swatch lifts a little under the pointer so a
                // grid of sixteen still feels like sixteen controls.
                transition: "box-shadow .18s ease, transform .15s ease",
              }}
              onMouseEnter={(e) => {
                if (appearance.accent !== c) e.currentTarget.style.transform = "scale(1.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
              }}
            />
          ))}
        </div>
      </Section>

      <Section title="Background" data-tour="settings-background" style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          {WALLPAPERS.map((w) => (
            <Button
              key={w}
              aria-pressed={appearance.wall === w}
              onClick={() => update("appearance", { wall: w })}
              style={{
                position: "relative",
                overflow: "hidden",
                height: 54,
                borderRadius: 10,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                padding: 0,
                background: "transparent",
                border: `1px solid ${
                  appearance.wall === w ? "var(--accent)" : "var(--line)"
                }`,
              }}
              // The swatch is the picture, so the hover lifts the frame rather
              // than tinting anything over the top of it. `border`, not
              // `borderColor`: the base sets the shorthand, and React clobbers
              // a shorthand when it removes a longhand that overlapped it — so
              // mixing the two left every swatch you had hovered with no border
              // at all and Chrome's black default showing through.
              hover={{
                border: `1px solid ${
                  appearance.wall === w ? "var(--accent)" : "var(--accentLine)"
                }`,
                transform: "translateY(-1px)",
                boxShadow: "0 4px 14px rgba(0,0,0,.18)",
              }}
            >
              <CrossfadeFill css={backgroundSwatch(theme, appearance.accent, w)} />
              <span
                style={{
                  // Above the fill layers, which are positioned.
                  position: "relative",
                  fontFamily: MONO,
                  fontSize: 9,
                  color: "var(--fg)",
                  textShadow: "0 1px 3px rgba(0,0,0,.6)",
                }}
              >
                {w}
              </span>
            </Button>
          ))}
        </div>
      </Section>

      {/* Click-to-zoom is parked until the interaction is good enough, so the
          picker is not offered. The modes still exist in the schema. */}

      <Section title="Grid" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Slider
            label="Corner radius"
            suffix="px"
            min={4}
            max={32}
            step={2}
            value={appearance.radius}
            onChange={(radius) => update("appearance", { radius })}
          />
          <Slider
            label="Tile opacity"
            suffix="%"
            min={0}
            max={100}
            step={5}
            value={appearance.alpha}
            onChange={(alpha) => update("appearance", { alpha })}
          />
          {/* Only where the choices actually produce different boards. The
              board is min(cap, window - padding), so on a window narrower than
              the smallest cap all three give the identical result — three pills
              that do nothing read as a broken setting rather than one that does
              not apply here. */}
          {widthChoices.length > 1 ? (
            <div>
              <div style={{ fontSize: 13, marginBottom: 7 }}>Board width</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {widthChoices.map((value) => (
                  <Pill
                    key={value}
                    active={(appearance.boardWidth || "comfortable") === value}
                    onClick={() => update("appearance", { boardWidth: value })}
                    style={{ fontSize: 11, padding: "5px 10px" }}
                  >
                    {BOARD_WIDTH_LABELS[value]}
                  </Pill>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
                How far the board spreads on a wide screen.
              </div>
            </div>
          ) : null}
          <div>
            <div style={{ fontSize: 13, marginBottom: 7 }}>Widget labels</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[
                ["both", "Dot & name"],
                ["name", "Name"],
                ["icon", "Dot"],
                ["none", "Neither"],
              ].map(([value, label]) => (
                <Pill
                  key={value}
                  active={(appearance.tileLabels || "both") === value}
                  onClick={() => update("appearance", { tileLabels: value })}
                  style={{ fontSize: 11, padding: "5px 10px" }}
                >
                  {label}
                </Pill>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
              Hiding both gives that row&rsquo;s height back to the widget.
            </div>
          </div>
          <Toggle
            label="Blur behind panels"
            on={appearance.blur !== false}
            onChange={() => update("appearance", { blur: appearance.blur === false })}
          />
          <Slider
            label="Page zoom"
            suffix="%"
            min={PAGE_ZOOM_MIN}
            max={PAGE_ZOOM_MAX}
            step={5}
            value={appearance.pageZoom ?? 100}
            onChange={(pageZoom) => update("appearance", { pageZoom })}
          />
        </div>
      </Section>

      <Section title="General" style={{ marginBottom: 22 }}>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--fg)" }}>Your name</span>
          <input
            value={profile.name}
            onChange={(e) => update("profile", { name: e.target.value })}
            placeholder="Used in the greeting"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              outline: "none",
              fontSize: 13,
              color: "var(--fg)",
            }}
          />
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Toggle
            label="Show greeting"
            on={behavior.showGreeting}
            onChange={() =>
              update("behavior", { showGreeting: !behavior.showGreeting })
            }
          />
          <Toggle
            label="Keyboard shortcuts"
            on={behavior.shortcuts}
            onChange={() => update("behavior", { shortcuts: !behavior.shortcuts })}
          />
        </div>
        <Pill
          onClick={() => update("behavior", { tourDone: false })}
          style={{ marginTop: 10, padding: "8px 14px", fontSize: 13 }}
        >
          Show the welcome card again
        </Pill>
        {/* Beside it rather than buried: the tour is the more useful of the two
            and the welcome card is mostly a name field. */}
        <Pill
          onClick={onTour}
          style={{ marginTop: 10, marginLeft: 6, padding: "8px 14px", fontSize: 13 }}
        >
          Take the tour
        </Pill>
      </Section>

      <Section title="Notifications" style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginBottom: 8 }}>
          Messages that appear at the bottom of the page. Each kind can be
          silenced on its own — undo prompts and version notices are not the
          same sort of message.
        </div>
        <Toggle
          label="Show notifications"
          on={notices.enabled !== false}
          onChange={() =>
            update("behavior", {
              notifications: { ...notices, enabled: notices.enabled === false },
            })
          }
        />
        <Collapse open={notices.enabled !== false}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              paddingLeft: 12,
              marginTop: 2,
              borderLeft: "1px solid var(--line)",
            }}
          >
            {CATEGORIES.map((key) => (
              <Toggle
                key={key}
                label={CATEGORY_LABELS[key]}
                on={notices.categories?.[key] !== false}
                onChange={() =>
                  update("behavior", {
                    notifications: {
                      ...notices,
                      categories: {
                        ...notices.categories,
                        [key]: notices.categories?.[key] === false,
                      },
                    },
                  })
                }
              />
            ))}
          </div>
        </Collapse>
      </Section>

      {/* Above search and below the board's own look: a profile owns both, so
          it reads as the thing the sections beneath it belong to. */}
      <Section title="Profiles" data-tour="settings-profiles" style={{ marginBottom: 22 }}>
        <ProfilesSection />
      </Section>

      <Section title="Search suggestions" style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginBottom: 8 }}>
          What the search box offers as you type. Answers are worked out here and
          need nothing; every source beyond your quick links needs a Chrome
          permission, asked for only when you switch it on.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Not one of SOURCES: those are places to look things up, each
              gated on a Chrome permission, and this is the box working out an
              answer on its own. It had no setting at all until now — the one
              feature in the search box that could not be turned off. */}
          <Toggle
            label="Answers and conversions"
            on={suggest.answers !== false}
            onChange={() =>
              update("behavior", { suggest: { ...suggest, answers: suggest.answers === false } })
            }
          />
          {SOURCES.map((source) => {
            const on = !!suggest[source.key];
            return (
              <Toggle
                key={source.key}
                label={source.label}
                on={on}
                // The permission request must run inside this click; Chrome
                // rejects one that is not tied to a user gesture.
                onChange={async () => {
                  if (!on && source.permission) {
                    // Requested together, in one call: real site icons in the
                    // results are worth asking for right alongside the source
                    // that will actually produce results to show them next
                    // to. Declining just the icon half of the dialog is not
                    // possible — Chrome shows one combined prompt — so this
                    // only fires when there is already a reason to prompt.
                    const granted = await requestAllPermissions([
                      source.permission,
                      "favicon",
                    ]);
                    if (!granted) {
                      toast(`${source.label} needs the ${source.permission} permission`);
                      return;
                    }
                  }
                  if (on && source.permission) {
                    // Give the permission back when the source is turned off.
                    dropPermission(source.permission);
                  }
                  update("behavior", { suggest: { ...suggest, [source.key]: !on } });
                }}
              />
            );
          })}
        </div>
      </Section>

      <Section title="About" style={{ marginBottom: 22 }}>
        <AboutSection toast={toast} />
      </Section>

      <Section title="Backup" data-tour="settings-backup">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
            Exports your layout, settings and widget content as a file on this
            device. Nothing is uploaded.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill
              onClick={async () => {
                download(await exportBackup(), backupFilename());
                toast("Backup downloaded");
              }}
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              Export
            </Pill>
            <Pill
              onClick={() => fileRef.current?.click()}
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              Import
            </Pill>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={importFile}
              style={{ display: "none" }}
            />
            <Pill
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                setConfirmReset(false);
                onReset();
                toast("Reset to defaults");
              }}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                color: "var(--danger)",
                borderColor: confirmReset ? "var(--danger)" : "var(--line)",
                transition: "border-color .18s ease",
              }}
            >
              {/* Keyed so the label crossfades on toggle instead of snapping. */}
              <span key={confirmReset ? "confirm" : "ask"} style={{ animation: "db-fade .2s ease both" }}>
                {confirmReset ? "Tap again to confirm" : "Reset everything"}
              </span>
            </Pill>
          </div>
        </div>
      </Section>
    </Drawer>
  );
}

export default SettingsDrawer;
