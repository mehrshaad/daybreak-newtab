import { useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { EditableText, HOVER_LIFT, MONO, softButton, Tooltip, useTooltip } from "@daybreak/sdk";
import { useSettings } from "../core/settingsContext";
import { canRemoveProfile, MAX_PROFILES, PROFILE_EMOJI } from "../core/profiles";
import { Button } from "./primitives";

// Where profiles are made, named and removed. The toolbar chip does the
// switching; this does everything that happens once and needs room to explain
// itself, which is the part that does not belong in a dropdown.

function EmojiPicker({ value, onPick, taken }) {
  return (
    <div
      role="group"
      aria-label="Profile icon"
      style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
    >
      {PROFILE_EMOJI.map((emoji) => {
        const chosen = emoji === value;
        // Marked rather than hidden: seeing that a neighbour already has the
        // briefcase is the point, and hiding it would make the row jump around
        // as profiles come and go.
        const used = !chosen && taken.has(emoji);
        return (
          <Button
            key={emoji}
            aria-label={emoji}
            aria-pressed={chosen}
            onClick={() => onPick(emoji)}
            // Dimmed when it is not the one in use, so lifting it back to full
            // on hover is the whole feedback this needs.
            hover={chosen ? null : { opacity: used ? 0.7 : 1 }}
            style={{
              width: 26,
              height: 26,
              display: "grid",
              placeItems: "center",
              padding: 0,
              border: 0,
              borderRadius: 999,
              flex: "none",
              cursor: "pointer",
              fontSize: 13,
              lineHeight: 1,
              background: "var(--panel2)",
              opacity: chosen ? 1 : used ? 0.35 : 0.7,
              boxShadow: chosen ? "0 0 0 2px var(--sheet), 0 0 0 4px var(--accent)" : "none",
              transition: "opacity .15s ease, box-shadow .18s ease",
            }}
          >
            {emoji}
          </Button>
        );
      })}
    </div>
  );
}

function ProfileRow({ profile, active, taken, onEdit, onRemove, onSwitch }) {
  const removeTip = useTooltip(`Delete ${profile.name} and its board`);
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 10,
        background: active ? "var(--accentSoft)" : "var(--panel)",
        border: `1px solid ${active ? "var(--accentLine)" : "var(--line)"}`,
        transition: "background .2s ease, border-color .2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1, flex: "none" }}>
          {profile.emoji}
        </span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--fg)" }}>
          <EditableText
            value={profile.name}
            onCommit={(name) => onEdit({ name })}
            placeholder="Profile name"
            ariaLabel="Profile name"
            inputStyle={{ display: "block", width: "100%", fontSize: 13 }}
          />
        </div>
        {active ? (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--accent)",
              flex: "none",
            }}
          >
            On now
          </span>
        ) : (
          <Button
            onClick={onSwitch}
            styleFor={softButton}
            style={{ padding: "5px 11px", fontSize: 12, background: "transparent", flex: "none" }}
            hover={HOVER_LIFT}
          >
            Switch
          </Button>
        )}
        {onRemove ? (
          <span ref={removeTip.anchorRef} style={{ display: "inline-flex", flex: "none" }} {...removeTip.anchorProps}>
            <Button
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${profile.name}`}
              style={{
                display: "grid",
                placeItems: "center",
                width: 26,
                height: 26,
                padding: 0,
                border: 0,
                borderRadius: 999,
                background: "transparent",
                color: "var(--faint)",
                cursor: "pointer",
              }}
              hover={{ background: "var(--sheetHover)", color: "var(--danger)" }}
            >
              <LuTrash2 size={13} />
            </Button>
          </span>
        ) : null}
        <Tooltip {...removeTip} />
      </div>

      <EmojiPicker value={profile.emoji} taken={taken} onPick={(emoji) => onEdit({ emoji })} />

      {confirming ? (
        // Asked in place rather than through a browser confirm(): a modal
        // dialog blocks the page, and this is the one action here that cannot
        // be undone, so it should say exactly what goes.
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            background: "var(--panel2)",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--fg)", lineHeight: 1.5 }}>
            Delete {profile.name}? Its board, its widget settings and its appearance go with it.
            Nothing in your other profiles changes.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              onClick={onRemove}
              styleFor={softButton}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                background: "transparent",
                borderColor: "var(--danger)",
                color: "var(--danger)",
              }}
              hover={HOVER_LIFT}
            >
              Delete it
            </Button>
            <Button
              onClick={() => setConfirming(false)}
              styleFor={softButton}
              style={{ padding: "5px 12px", fontSize: 12, background: "transparent" }}
              hover={HOVER_LIFT}
            >
              Keep it
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfilesSection() {
  const { profiles, activeProfileId, switchProfile, createProfile, editProfile, deleteProfile } =
    useSettings();
  const list = profiles?.list || [];
  const taken = new Set(list.map((p) => p.emoji));
  const room = list.length < MAX_PROFILES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
        Separate boards on one install, for work and home or anything else. Each keeps its own
        layout, appearance and widget settings, and each syncs on its own. Chrome permissions are
        shared: they are granted to the extension rather than to a board, so a source you switch on
        in one profile stays on in all of them.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((profile) => (
          <ProfileRow
            key={profile.id}
            profile={profile}
            active={profile.id === activeProfileId}
            taken={taken}
            onEdit={(patch) => editProfile(profile.id, patch)}
            onSwitch={() => switchProfile(profile.id)}
            onRemove={
              canRemoveProfile(profiles, profile.id) ? () => deleteProfile(profile.id) : undefined
            }
          />
        ))}
      </div>

      {room ? (
        <Button
          onClick={() => createProfile({})}
          styleFor={softButton}
          style={{
            alignSelf: "flex-start",
            padding: "7px 13px",
            fontSize: 12,
            background: "transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
          hover={{ ...HOVER_LIFT, color: "var(--accent)" }}
        >
          <LuPlus size={13} />
          Add a profile
        </Button>
      ) : (
        <div style={{ fontSize: 11, color: "var(--faint)" }}>
          Three is the limit. Each profile is its own synced item, and three is what fits
          comfortably in what Chrome gives an extension to sync.
        </div>
      )}
    </div>
  );
}

export default ProfilesSection;
