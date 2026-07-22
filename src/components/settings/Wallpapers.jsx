import { Col, Row } from "antd";
import { useEffect, useState } from "react";
import "../../styles/components/Wallpapers.scss";
import { useSettings } from "../../context/SettingsContext";
import { classNames } from "../../utils";

function Wallpapers({ open }) {
  const [wallpapers, setWallpapers] = useState([]);
  const { settings, updateSettings } = useSettings();
  const { wallpaper } = settings;

  useEffect(() => {
    const loadImages = async () => {
      const imageContext = import.meta.glob("../../assets/backgrounds/*.jpg");
      const loadedImages = [];

      for (const path in imageContext) {
        const module = await imageContext[path]();
        loadedImages.push(module.default);
      }

      setWallpapers(loadedImages);
    };

    loadImages();
  }, []);

  return (
    <Row gutter={[16, 20]} justify="space-between" align="middle">
      {wallpapers.map((photo, index) => (
        <Col
          key={index}
          className={classNames(
            "wallpaper-photos animate__animated animate__faster",
            open && "animate__fadeIn"
          )}
          style={{
            animationDelay: `${index * 0.05}s`,
          }}
          span={8}
        >
          <img
            src={photo}
            alt={`Wallpaper ${index + 1}`}
            className={photo === wallpaper && "active"}
            onClick={() => updateSettings("wallpaper", photo)}
          />
        </Col>
      ))}
    </Row>
  );
}

export default Wallpapers;
