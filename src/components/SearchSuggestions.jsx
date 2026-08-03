import { LuBookmark, LuClock, LuExternalLink, LuLink } from "react-icons/lu";
import { MONO } from "@daybreak/sdk";

const KIND_ICON = {
  links: LuLink,
  tabs: LuExternalLink,
  bookmarks: LuBookmark,
  history: LuClock,
};

const KIND_LABEL = {
  links: "link",
  tabs: "open tab",
  bookmarks: "bookmark",
  history: "history",
};

// Dropdown under the search box. Purely presentational — the parent owns the
// query, the results and which row is active.
function SearchSuggestions({ items, activeIndex, onPick, onHover }) {
  if (!items.length) return null;

  return (
    <div
      role="listbox"
      aria-label="Search suggestions"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        zIndex: 60,
        padding: "5px 0",
        borderRadius: 14,
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        backdropFilter: "var(--blur-panel)",
        boxShadow: "0 22px 60px rgba(0,0,0,.32)",
        overflow: "hidden",
        animation: "db-rise-in .16s ease both",
      }}
    >
      {items.map((item, i) => {
        const Icon = KIND_ICON[item.kind] || LuLink;
        const active = i === activeIndex;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={active}
            // mousedown, not click: the input's blur would otherwise tear the
            // list down before the click landed.
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(item);
            }}
            onMouseEnter={() => onHover(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "9px 14px",
              border: 0,
              background: active ? "var(--accentSoft)" : "transparent",
              color: "var(--fg)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Icon
              size={13}
              style={{ flex: "none", color: active ? "var(--accent)" : "var(--faint)" }}
            />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.title}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: "var(--faint)",
                flex: "none",
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.subtitle || KIND_LABEL[item.kind]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SearchSuggestions;
