import { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { classNames } from "../utils";
import { getCustomWallpaper, resolveWallpaper } from "../utils/wallpapers";

function Background({ blur }) {
  const {
    settings: { wallpaper },
  } = useSettings();
  const [url, setUrl] = useState(() =>
    wallpaper === "custom" ? null : resolveWallpaper(wallpaper)
  );

  useEffect(() => {
    let active = true;
    if (wallpaper === "custom") {
      getCustomWallpaper().then((data) => {
        if (active) setUrl(resolveWallpaper("custom", data));
      });
    } else {
      setUrl(resolveWallpaper(wallpaper));
    }
    return () => {
      active = false;
    };
  }, [wallpaper]);

  return (
    <>
      <div
        className="bg"
        style={{ backgroundImage: url ? `url(${url})` : undefined }}
      />
      <div className={classNames("bg-filter", blur && "backdrop-blur")} />
    </>
  );
}

export default Background;
