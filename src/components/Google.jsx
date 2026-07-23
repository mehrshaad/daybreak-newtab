import { useEffect, useState } from "react";
import { TbGridDots } from "react-icons/tb";
import "../styles/components/Google.scss";
import { classNames } from "../utils";
import { Icon, IconGoogle } from "./Icon";

function Apps({ open = false, active = false }) {
  return (
    active && (
      <div
        className={classNames(
          "google-apps animate__animated animate__faster",
          open ? "animate__slideInRight" : "animate__fadeOutRight"
        )}
      >
        <IconGoogle />
        <button
          className="more"
          onClick={() => window.open("https://about.google/products/", "_self")}
        >
          More Google Products
        </button>
      </div>
    )
  );
}

function Google() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open &&
        !event.target.closest(".google-button") &&
        !event.target.closest(".google-apps")
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [open]);
  return (
    <>
      <div
        className={classNames("google-button", open && "active")}
        role="button"
        tabIndex={0}
        aria-label="Google apps"
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
            setActive(true);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
          setActive(true);
        }}
      >
        <Icon Component={TbGridDots} />
      </div>
      <Apps open={open} active={active} />
    </>
  );
}

export default Google;
