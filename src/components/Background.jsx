import { useSettings } from "../context/SettingsContext";
import { classNames } from "../utils";

function Background({ blur }) {
  const {
    settings: { wallpaper },
  } = useSettings();

  return (
    <>
      <div className="bg" style={{ backgroundImage: `url(${wallpaper})` }} />
      <div className={classNames("bg-filter", blur && "backdrop-blur")} />
    </>
  );
}

export default Background;
