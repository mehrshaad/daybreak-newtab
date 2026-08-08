import { LuArrowRight, LuBookmark, LuClock, LuExternalLink, LuLink } from "react-icons/lu";
import { Favicon, MONO, Popover } from "@daybreak/sdk";

const KIND_ICON = {
  links: LuLink,
  tabs: LuExternalLink,
  bookmarks: LuBookmark,
  history: LuClock,
  go: LuArrowRight,
};

const KIND_LABEL = {
  links: "link",
  tabs: "open tab",
  bookmarks: "bookmark",
  history: "history",
};

// Dropdown under the search box. Purely presentational — the parent owns the
// query, the results and which row is active.
//
// A Popover rather than an absolutely-positioned div: the header sits above
// the board, so clipping was never the problem here the way it was for a
// dropdown inside a tile, but anchoring this way still means the same
// viewport-clamped, blur-aware surface every other floating panel uses, for
// free. `open` is always true while this is even rendered — the parent
// already unmounts it once there is nothing to show — so onClose exists only
// for Escape and an outside click, both of which just clear the list.
function SearchSuggestions({ items, activeIndex, anchorRef, onPick, onHover, onClose }) {
  if (!items.length) return null;

  return (
    <Popover open anchorRef={anchorRef} onClose={onClose}>
      <div role="listbox" aria-label="Search suggestions" style={{ padding: "5px 0" }}>
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
              <Favicon
                url={item.faviconUrl ?? item.url}
                size={14}
                fallback={
                  <Icon
                    size={13}
                    style={{
                      flex: "none",
                      color: active ? "var(--accent)" : "var(--faint)",
                    }}
                  />
                }
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
    </Popover>
  );
}

export default SearchSuggestions;
