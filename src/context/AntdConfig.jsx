import { ConfigProvider } from "antd";

function AntdConfig({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ff7a5c",
          borderRadius: 14,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          controlHeight: 38,
        },
        components: {
          Button: {
            borderRadius: 14,
            controlHeight: 38,
            fontWeight: 600,
            primaryShadow: "none",
            defaultShadow: "none",
          },
          Segmented: {
            borderRadius: 12,
            trackBg: "rgba(var(--settings-button-bg-color), 0.2)",
          },
          Select: {
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
