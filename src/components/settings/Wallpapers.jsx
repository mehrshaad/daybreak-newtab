import { UploadOutlined } from "@ant-design/icons";
import { Button, Col, Row, Upload, message } from "antd";
import { useEffect, useState } from "react";
import "../../styles/components/Wallpapers.scss";
import { useSettings } from "../../context/SettingsContext";
import { classNames } from "../../utils";
import {
  WALLPAPERS,
  getCustomWallpaper,
  setCustomWallpaper,
} from "../../utils/wallpapers";

// Downscale an uploaded image to keep the stored data URL small.
function downscale(file, maxW = 1920) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Wallpapers({ open }) {
  const { settings, updateSettings } = useSettings();
  const { wallpaper } = settings;
  const [customPreview, setCustomPreview] = useState(null);

  useEffect(() => {
    getCustomWallpaper().then(setCustomPreview);
  }, []);

  const beforeUpload = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Please choose an image file.");
      return false;
    }
    downscale(file)
      .then((dataUrl) => {
        setCustomWallpaper(dataUrl);
        setCustomPreview(dataUrl);
        updateSettings("wallpaper", "custom");
        message.success("Custom wallpaper set.");
      })
      .catch(() => message.error("Could not read that image."));
    return false;
  };

  return (
    <Row gutter={[16, 20]} justify="space-between" align="middle">
      <Col span={24}>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={beforeUpload}
        >
          <Button block icon={<UploadOutlined />}>
            Upload your own
          </Button>
        </Upload>
      </Col>
      {customPreview && (
        <Col
          className={classNames(
            "wallpaper-photos animate__animated animate__faster",
            open && "animate__fadeIn"
          )}
          span={8}
        >
          <img
            src={customPreview}
            alt="Custom wallpaper"
            className={wallpaper === "custom" ? "active" : undefined}
            onClick={() => updateSettings("wallpaper", "custom")}
          />
        </Col>
      )}
      {WALLPAPERS.map(({ key, thumb }, index) => (
        <Col
          key={key}
          className={classNames(
            "wallpaper-photos animate__animated animate__faster",
            open && "animate__fadeIn"
          )}
          style={{ animationDelay: `${index * 0.05}s` }}
          span={8}
        >
          <img
            src={thumb}
            alt={`Wallpaper ${key}`}
            className={wallpaper === key ? "active" : undefined}
            onClick={() => updateSettings("wallpaper", key)}
          />
        </Col>
      ))}
    </Row>
  );
}

export default Wallpapers;
