import { Col, Row, Typography, Checkbox, Tooltip } from "antd";
import { useSettings } from "../../context/SettingsContext";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Icon } from "../Icon";
import "../../styles/components/Bookmarks.scss";
import { classNames } from "../../utils";
import { IconBookmark } from "../Icon";

function Bookmarks({ open }) {
  const { Paragraph } = Typography;
  const { settings, updateSettings } = useSettings();
  const { bookmarks } = settings;
  const {
    showBookmarks,
    showBookmarksLogo,
    showBookmarksColors,
    showBookmarksText,
    bookmarksList,
  } = bookmarks;

  const handleUrlChange = (value, index, key) => {
    if (key === "name")
      updateSettings("bookmarks", {
        ...bookmarks,
        bookmarksList: [
          ...bookmarksList.map((bookmark, i) =>
            i === index
              ? { ...bookmark, name: value, icon: IconBookmark(value) }
              : bookmark
          ),
        ],
      });
    if (key === "url")
      updateSettings("bookmarks", {
        ...bookmarks,
        bookmarksList: [
          ...bookmarksList.map((bookmark, i) =>
            i === index ? { ...bookmark, url: value } : bookmark
          ),
        ],
      });
  };

  const handleBookmarkLogoUpdate = (e) => {
    updateSettings("bookmarks", {
      ...bookmarks,
      showBookmarksLogo: e.target.checked,
    });
  };
  const handleBookmarkColorsUpdate = (e) => {
    updateSettings("bookmarks", {
      ...bookmarks,
      showBookmarksColors: e.target.checked,
    });
  };
  const handleBookmarkTextUpdate = (e) => {
    updateSettings("bookmarks", {
      ...bookmarks,
      showBookmarksText: e.target.checked,
    });
  };
  const handleBookmarkUpdate = (e) => {
    updateSettings("bookmarks", {
      ...bookmarks,
      showBookmarks: e.target.checked,
    });
  };

  const handleBookmarkDelete = (index) => {
    updateSettings("bookmarks", {
      ...bookmarks,
      bookmarksList: [...bookmarksList.filter((bookmark, i) => i !== index)],
    });
  };

  const handleBookmarkAdd = () => {
    updateSettings("bookmarks", {
      ...bookmarks,
      bookmarksList: [
        ...bookmarksList,
        {
          name: "New Favorite!",
          url: "https://github.com/mehrshaad",
          color: `hsla(${Math.random() * 360}, 100%, 87%, 0.8)`,
          icon: IconBookmark("favorite"),
        },
      ],
    });
  };

  return (
    <Row gutter={[8, 8]}>
      <Col
        span={12}
        className={classNames(
          "animate__animated animate__faster",
          open && "animate__fadeIn"
        )}
      >
        <div className={classNames("bookmark-container show-bookmarks")}>
          <h3>
            <Checkbox
              onChange={handleBookmarkUpdate}
              disabled={bookmarksList.length <= 0}
              checked={showBookmarks && bookmarksList.length > 0}
            />
            Show Favorites
          </h3>
        </div>
      </Col>
      <Col
        span={12}
        className={classNames(
          "animate__animated animate__faster",
          open && "animate__fadeIn"
        )}
      >
        <div className={classNames("bookmark-container show-bookmarks")}>
          <h3>
            <Checkbox
              onChange={handleBookmarkLogoUpdate}
              disabled={!showBookmarks || bookmarksList.length <= 0}
              checked={showBookmarksLogo && bookmarksList.length > 0}
            />
            Show Logos
          </h3>
        </div>
      </Col>
      <Col
        span={12}
        className={classNames(
          "animate__animated animate__faster",
          open && "animate__fadeIn"
        )}
      >
        <div className={classNames("bookmark-container show-bookmarks")}>
          <h3>
            <Checkbox
              onChange={handleBookmarkTextUpdate}
              disabled={!showBookmarks || bookmarksList.length <= 0}
              checked={showBookmarksText && bookmarksList.length > 0}
            />
            Show Names
          </h3>
        </div>
      </Col>
      <Col
        span={12}
        className={classNames(
          "animate__animated animate__faster",
          open && "animate__fadeIn"
        )}
      >
        <div className={classNames("bookmark-container show-bookmarks")}>
          <h3>
            <Checkbox
              onChange={handleBookmarkColorsUpdate}
              disabled={!showBookmarks || bookmarksList.length <= 0}
              checked={showBookmarksColors && bookmarksList.length > 0}
            />
            Colorful Background
          </h3>
        </div>
      </Col>
      {bookmarksList.map(({ name, url }, index) => (
        <Col
          key={index}
          span={8}
          className={classNames(
            "animate__animated animate__faster",
            open && "animate__fadeIn"
          )}
          style={{
            animationDelay: `${(index + 1) * 0.1}s`,
            transition: "all 0.2s ease-in-out",
          }}
        >
          <div className={classNames("bookmark-container")}>
            <h3>Name:</h3>
            <Paragraph
              editable={{
                onChange: (value) => handleUrlChange(value, index, "name"),
                triggerType: ["text2", "icon"],
                tooltip: "Edit Name",
                maxLength: 20,
              }}
              // ellipsis={{ rows: 2 }}
            >
              {name}
            </Paragraph>
            <h3>URL:</h3>
            <Paragraph
              className="bookmark-url"
              editable={{
                onChange: (value) => handleUrlChange(value, index, "url"),
                triggerType: ["text2", "icon"],
                tooltip: "Edit URL",
              }}
              ellipsis={{ rows: 1 }}
            >
              {url}
            </Paragraph>
            <Tooltip title={`Delete This Favorite?`}>
              <div
                className="delete-bookmark"
                onClick={() => handleBookmarkDelete(index)}
              >
                <Icon Component={LuTrash2} />
              </div>
            </Tooltip>
          </div>
        </Col>
      ))}
      <Col
        span={24}
        className={classNames(
          "animate__animated animate__faster",
          open && "animate__fadeIn"
        )}
      >
        <div
          className={classNames("bookmark-container add-bookmark")}
          onClick={handleBookmarkAdd}
        >
          <h3>
            <Icon Component={LuPlus} />
            Add new favorite page
          </h3>
        </div>
      </Col>
    </Row>
  );
}

export default Bookmarks;
