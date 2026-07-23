import { Drawer } from "antd";
import { useEffect, useState } from "react";
import { LuLayoutGrid } from "react-icons/lu";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/Bookmarks.scss";
import { classNames } from "../utils";
import { getChromeBookmarks } from "../utils/chromeBookmarks";
import IconTile from "./IconTile";

const ITEM_WIDTH = 76; // tile + gap; used to fit the dock to one row

function BookmarkItem({
  name,
  url,
  index = 0,
  size = 56,
  showText = true,
  colorful = true,
  showGlyph = true,
}) {
  const open = () => window.open(url, "_self");
  return (
    <div
      className="bookmark animate__animated animate__scaleIn"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div
        className="iOS"
        role="button"
        tabIndex={0}
        aria-label={name}
        onClick={open}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
      >
        <IconTile
          name={name}
          size={size}
          colorful={colorful}
          showGlyph={showGlyph}
        />
        {showText && <p className="move-in-text">{name}</p>}
      </div>
    </div>
  );
}

function Bookmarks() {
  const { settings } = useSettings();
  const { bookmarks } = settings;
  const {
    showBookmarks,
    showBookmarksLogo,
    showBookmarksColors,
    showBookmarksText,
    bookmarksList,
  } = bookmarks;

  const [chromeBm, setChromeBm] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [maxItems, setMaxItems] = useState(12);

  useEffect(() => {
    getChromeBookmarks().then(setChromeBm);
  }, []);

  useEffect(() => {
    const recompute = () => {
      const w = Math.min(window.innerWidth * 0.86, 1180);
      setMaxItems(Math.max(4, Math.floor(w / ITEM_WIDTH)));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  if (!showBookmarks) return null;

  const custom = (bookmarksList || []).map((b) => ({ name: b.name, url: b.url }));
  const seen = new Set(custom.map((c) => c.url));
  const fromChrome = chromeBm
    .filter((b) => b.url && !seen.has(b.url))
    .map((b) => ({ name: b.title, url: b.url }));
  const all = [...custom, ...fromChrome];

  const overflow = all.length > maxItems;
  const visible = overflow ? all.slice(0, maxItems - 1) : all;

  return (
    <>
      <div className="bookmarks-container">
        {visible.map((item, index) => (
          <BookmarkItem
            key={`${item.url}-${index}`}
            {...item}
            index={index}
            showText={showBookmarksText}
            colorful={showBookmarksColors}
            showGlyph={showBookmarksLogo}
          />
        ))}
        {overflow && (
          <div className="bookmark">
            <div
              className="iOS"
              role="button"
              tabIndex={0}
              aria-label="All bookmarks"
              onClick={() => setDrawerOpen(true)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && setDrawerOpen(true)
              }
            >
              <div
                className="icon-tile more-tile"
                style={{ width: 56, height: 56, borderRadius: 16 }}
              >
                <LuLayoutGrid size={26} color="#fff" />
              </div>
              {showBookmarksText && <p className="move-in-text">All</p>}
            </div>
          </div>
        )}
      </div>

      <Drawer
        title="Bookmarks"
        placement="right"
        width={340}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rootClassName="bookmarks-drawer"
      >
        {custom.length > 0 && (
          <>
            <h4 className="drawer-section">Your shortcuts</h4>
            <div className="drawer-grid">
              {custom.map((item, i) => (
                <BookmarkItem
                  key={`c-${i}`}
                  {...item}
                  index={i}
                  size={46}
                  colorful={showBookmarksColors}
                  showGlyph={showBookmarksLogo}
                />
              ))}
            </div>
          </>
        )}
        {fromChrome.length > 0 && (
          <>
            <h4 className="drawer-section">Chrome bookmarks</h4>
            <div className="drawer-list">
              {fromChrome.map((item, i) => (
                <div
                  key={`b-${i}`}
                  className="drawer-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => window.open(item.url, "_self")}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    window.open(item.url, "_self")
                  }
                >
                  <IconTile name={item.name} size={30} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {custom.length === 0 && fromChrome.length === 0 && (
          <p className={classNames("drawer-empty")}>No bookmarks yet.</p>
        )}
      </Drawer>
    </>
  );
}

export default Bookmarks;
