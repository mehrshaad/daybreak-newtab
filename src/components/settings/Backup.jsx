import {
  DownloadOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Space, Upload, message } from "antd";
import { useSettings } from "../../context/SettingsContext";

function Backup() {
  const { settings, replaceSettings, resetSettings } = useSettings();

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

  const beforeUpload = (file) => {
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
    return false; // prevent antd from uploading anywhere
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button block icon={<DownloadOutlined />} onClick={exportSettings}>
        Export settings
      </Button>
      <Upload accept=".json" showUploadList={false} beforeUpload={beforeUpload}>
        <Button block icon={<UploadOutlined />}>
          Import settings
        </Button>
      </Upload>
      <Popconfirm
        title="Reset all settings to defaults?"
        onConfirm={resetSettings}
        okText="Reset"
        cancelText="Cancel"
      >
        <Button block danger icon={<ReloadOutlined />}>
          Reset to defaults
        </Button>
      </Popconfirm>
    </Space>
  );
}

export default Backup;
