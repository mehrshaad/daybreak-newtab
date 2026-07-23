import { Col, Input, Row, Select } from "antd";
import { useSettings } from "../../context/SettingsContext";
import { SEARCH_ENGINES } from "../../utils";

function General() {
  const { settings, updateSettings } = useSettings();
  const { general } = settings;

  const setName = (e) =>
    updateSettings("general", { ...general, name: e.target.value });
  const setEngine = (searchEngine) =>
    updateSettings("general", { ...general, searchEngine });

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <h3>Your name</h3>
        <Input
          placeholder="Used in the greeting, e.g. Mehrshad"
          value={general?.name || ""}
          onChange={setName}
          allowClear
          maxLength={30}
        />
      </Col>
      <Col span={24}>
        <h3>Search engine</h3>
        <Select
          style={{ width: "100%" }}
          value={general?.searchEngine || "google"}
          onChange={setEngine}
          options={Object.entries(SEARCH_ENGINES).map(([value, engine]) => ({
            value,
            label: engine.label,
          }))}
        />
      </Col>
    </Row>
  );
}

export default General;
