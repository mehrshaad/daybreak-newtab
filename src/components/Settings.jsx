import { CloseOutlined, SettingFilled } from "@ant-design/icons";
import { Collapse, Divider } from "antd";
import { useEffect, useRef, useState } from "react";
import "../styles/components/Settings.scss";
import { classNames } from "../utils/index";
import Backup from "./settings/Backup";
import Bookmarks from "./settings/Bookmarks";
import General from "./settings/General";
import Leftbar from "./settings/Leftbar";
import Wallpapers from "./settings/Wallpapers";

function Panel({ active, open }) {
  const panelRef = useRef(null);

  const panelContext = [
    {
      key: "General",
      label: "General",
      children: (
        <>
          <General open={open} />
          <Divider />
        </>
      ),
    },
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
      children: (
        <>
          <Wallpapers open={open} />
          <Divider />
        </>
      ),
    },
    {
      key: "Backup & Reset",
      label: "Backup & Reset",
      children: <Backup />,
    },
  ];

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
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <div
        ref={buttonRef}
        className="settings-button"
        role="button"
        tabIndex={0}
        aria-label="Open settings"
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
