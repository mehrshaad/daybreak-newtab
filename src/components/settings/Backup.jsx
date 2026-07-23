import {
  DownloadOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Col, Popconfirm, Row, message } from "antd";
import { useRef } from "react";
import { useSettings } from "../../context/SettingsContext";

function Backup() {
  const { settings, replaceSettings, resetSettings } = useSettings();
  const fileRef = useRef();

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daybreak-settings.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new Error("invalid");
        }
        replaceSettings(data);
        message.success("Settings imported.");
      } catch {
        message.error("That is not a valid Daybreak settings file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Row gutter={[10, 10]}>
      <Col span={12}>
        <Button
          block
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportSettings}
        >
          Export
        </Button>
      </Col>
      <Col span={12}>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={onFile}
        />
        <Button
          block
          icon={<UploadOutlined />}
          onClick={() => fileRef.current?.click()}
          style={{
            background: "#2fa25a",
            borderColor: "#2fa25a",
            color: "#fff",
          }}
        >
          Import
        </Button>
      </Col>
      <Col span={24}>
        <Popconfirm
          title="Reset all settings to defaults?"
          onConfirm={resetSettings}
          okText="Reset"
          cancelText="Cancel"
        >
          <Button block danger type="primary" icon={<ReloadOutlined />}>
            Reset to defaults
          </Button>
        </Popconfirm>
      </Col>
    </Row>
  );
}

export default Backup;
