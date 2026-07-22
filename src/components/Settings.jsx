import { CloseOutlined, SettingFilled } from "@ant-design/icons";
import { Collapse, Divider } from "antd";
import { useEffect, useRef, useState } from "react";
import "../styles/components/Settings.scss";
import { classNames } from "../utils/index";
import Wallpapers from "./settings/Wallpapers";
import Leftbar from "./settings/Leftbar";
import Bookmarks from "./settings/Bookmarks";

const panelContext = [
  {
    key: "Favorite Pages",
    label: "Favorite Pages",
    children: (
      <>
        <Bookmarks open={open} />
        <Divider />
      </>
    ),
  },
  {
    key: "Left Bar Content",
    label: "Left Bar Content",
    children: (
      <>
        <Leftbar open={open} />
        <Divider />
      </>
    ),
  },
  {
    key: "Wallpapers",
    label: "Wallpapers",
    children: <Wallpapers open={open} />,
  },
];

function Panel({ active, open }) {
  const panelRef = useRef(null);

  return (
    active && (
      <div
        ref={panelRef}
        className={classNames(
          "settings-panel full animate__animated animate__faster",
          open ? "animate__slideInRight" : "animate__slideOutRight"
        )}
      >
        <h2 className="title">Settings</h2>
        <Collapse ghost items={panelContext} />
      </div>
    )
  );
}

function Settings() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        !event.target.closest(".settings-panel") &&
        !event.target.closest(".settings-panel *") &&
        !event.target.closest(".ant-select-dropdown")
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <div
        ref={buttonRef}
        className="settings-button"
        onClick={() => {
          setActive(true);
          setOpen(!open);
        }}
      >
        {open ? (
          <CloseOutlined className="animate__animated animate__faster animate__flipInY" />
        ) : (
          <SettingFilled className="animate__animated animate__faster animate__flipInY" />
        )}
      </div>
      <Panel active={active} open={open} setOpen={setOpen} />
    </>
  );
}

export default Settings;
