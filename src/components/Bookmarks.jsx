import { Avatar, Col, Row } from "antd";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/Bookmarks.scss";
import { classNames, faviconFromUrl } from "../utils";
import { IconBookmark } from "./Icon";

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

  return (
    <Row
      className="bookmarks-container"
      justify="center"
      align={"top"}
      gutter={[16, 16]}
    >
      {bookmarksList.map((item, index) => (
        <Col key={item?.name}>
          <Bookmark
            index={index}
            {...item}
            showBookmarks={showBookmarks}
            showBookmarksText={showBookmarksText}
            showBookmarksLogo={showBookmarksLogo}
            showBookmarksColors={showBookmarksColors}
          />
        </Col>
      ))}
    </Row>
  );
}

function Bookmark({
  index,
  name,
  url,
  color,
  showBookmarks,
  showBookmarksText,
  showBookmarksLogo,
  showBookmarksColors,
}) {
  const openLink = () => {
    window.open(url, "_self");
  };

  // Resolve the icon fresh from the name (a built-in logo) and fall back to the
  // site's own favicon; Avatar shows the first letter if neither loads. This
  // avoids relying on a stored asset path that changes between builds.
  const resolvedIcon = IconBookmark(name);
  const iconSrc = showBookmarksLogo
    ? resolvedIcon || faviconFromUrl(url)
    : undefined;

  return (
    <div
      className={classNames(
        "bookmark animate__animated",
        !showBookmarks ? "animate__scaleOut" : "animate__scaleIn"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className="iOS"
        onClick={openLink}
        role="button"
        tabIndex={0}
        aria-label={name}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openLink()}
      >
        <Avatar
          className="avatar"
          shape="square"
          style={{
            background:
              showBookmarksColors &&
              `linear-gradient(180deg, var(--bookmark-bg-color), ${color}) !important`,
          }}
          src={iconSrc || undefined}
        >
          {name?.[0]}
        </Avatar>
        <p
          className={classNames(
            showBookmarksText ? "move-in-text" : "move-out-text"
          )}
        >
          {name}
        </p>
      </div>
    </div>
  );
}

export default Bookmarks;
