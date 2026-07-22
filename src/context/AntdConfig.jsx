import { ConfigProvider } from "antd";
function AntdConfig({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          Select: {
            // colorBgContainer: "transparent",
            colorPrimary: "var(--settings-button-color-hover)",
            colorBgElevated: "rgba(var(--settings-button-bg-color),0.6)",
            activeBorderColor: "transparent",
            activeOutlineColor: "transparent",
            borderRadius: "var(--border-radius)",
            borderRadiusXL: "var(--border-radius)",
            borderRadiusLG: "var(--border-radius)",
            borderRadiusSM: "var(--border-radius)",
            optionSelectedBg: "var(--settings-dropdown-selected)",
            multipleItemBg: "var(--settings-dropdown-selected)",
            selectorBg: "rgba(var(--settings-button-bg-color),0.2)",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default AntdConfig;
