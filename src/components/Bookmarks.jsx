import { Col, Row } from "antd";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/Bookmarks.scss";
import { classNames } from "../utils";
import IconTile from "./IconTile";

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
  showBookmarks,
  showBookmarksText,
  showBookmarksLogo,
  showBookmarksColors,
}) {
  const openLink = () => {
    window.open(url, "_self");
  };

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
        <IconTile
          name={name}
          size={56}
          colorful={showBookmarksColors}
          showGlyph={showBookmarksLogo}
        />
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
