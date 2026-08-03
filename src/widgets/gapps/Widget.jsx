import IconTile from "../../components/IconTile";

// Carried over from the v1 launcher. Names double as IconTile keys, so each
// gets its brand glyph from the bundled icon set.
const APPS = [
  { name: "Gmail", key: "gmail", url: "https://mail.google.com/" },
  { name: "Drive", key: "drive", url: "https://drive.google.com/" },
  { name: "Calendar", key: "calendar", url: "https://calendar.google.com/" },
  { name: "Meet", key: "meet", url: "https://meet.google.com/" },
  { name: "Docs", key: "docs", url: "https://docs.google.com/" },
  { name: "Sheets", key: "sheets", url: "https://sheets.google.com/" },
  { name: "Slides", key: "slides", url: "https://slides.google.com/" },
  { name: "Keep", key: "keep", url: "https://keep.google.com/" },
  { name: "Photos", key: "photos", url: "https://photos.google.com/" },
  { name: "Maps", key: "maps", url: "https://maps.google.com/" },
  { name: "Translate", key: "translate", url: "https://translate.google.com/" },
  { name: "Contacts", key: "contacts", url: "https://contacts.google.com/" },
  { name: "Classroom", key: "classroom", url: "https://classroom.google.com/" },
  { name: "Scholar", key: "scholar", url: "https://scholar.google.com/" },
  { name: "Colab", key: "colab", url: "https://colab.research.google.com/" },
  { name: "Account", key: "account", url: "https://myaccount.google.com/" },
];

function GoogleApps({ options, size, focused, editing }) {
  const { hideLabels, newTab } = options;
  // Fill the tile: more columns when it is wider or zoomed.
  const columns = focused ? 8 : Math.max(4, size[0] + 1);
  const visible = focused ? APPS : APPS.slice(0, columns * (size[1] >= 3 ? 3 : 2));

  const open = (url) => {
    if (newTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 6,
        flex: 1,
        alignContent: "center",
        minWidth: 0,
      }}
    >
      {visible.map((app) => (
        <button
          key={app.key}
          type="button"
          title={app.name}
          onClick={(e) => {
            e.stopPropagation();
            if (editing) return;
            open(app.url);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            padding: "8px 2px",
            borderRadius: 10,
            border: 0,
            background: "transparent",
            cursor: editing ? "grab" : "pointer",
            minWidth: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--panel2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <IconTile name={app.key} size={focused ? 38 : 26} />
          {hideLabels ? null : (
            <span
              style={{
                fontSize: 10,
                color: "var(--dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {app.name}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default GoogleApps;
