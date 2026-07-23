import { Button, Checkbox, Col, Row, Segmented, Select, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useRef, useState } from "react";
import { LuGlobe, LuListTodo } from "react-icons/lu";
import { RiRobot2Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/components/Leftbar.scss";
import { classNames } from "../../utils";
import { Icon } from "../Icon";

function Leftbar({ open }) {
  const { settings, updateSettings } = useSettings();
  const { leftbar, cities, todo } = settings;
  const [cityResults, setCityResults] = useState([]);
  const searchTimer = useRef();
  const MAX_CITIES = 5;

  const cityKey = (c) =>
    typeof c === "object" ? `${c.latitude},${c.longitude}` : c;

  const handleItemClick = (key) => {
    if (key === "chatgpt") {
      window.open("https://chat.openai.com", "_blank", "noopener,noreferrer");
      return;
    }
    updateSettings("leftbar", key);
  };

  const searchCities = (q) => {
    clearTimeout(searchTimer.current);
    if (!q || q.trim().length < 2) {
      setCityResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            q
          )}&count=8&language=en&format=json`
        );
        const data = await res.json();
        setCityResults(
          (data.results || []).map((r) => ({
            value: `${r.latitude},${r.longitude}`,
            label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
            city: {
              name: r.name,
              country: r.country,
              latitude: r.latitude,
              longitude: r.longitude,
              timezone: r.timezone,
            },
          }))
        );
      } catch {
        setCityResults([]);
      }
    }, 300);
  };

  const addCity = (value) => {
    const opt = cityResults.find((o) => o.value === value);
    if (!opt) return;
    const list = cities?.cityList || [];
    if (list.length >= MAX_CITIES || list.some((c) => cityKey(c) === value))
      return;
    updateSettings("cities", { ...cities, cityList: [...list, opt.city] });
    setCityResults([]);
  };

  const removeCity = (idx) => {
    const list = (cities?.cityList || []).filter((_, i) => i !== idx);
    updateSettings("cities", { ...cities, cityList: list });
  };

  const setUnit = (unit) => updateSettings("cities", { ...cities, unit });

  const handleCitiesClockUpdate = (e) => {
    updateSettings("cities", { ...cities, showClock: e.target.checked });
  };
  const handleCitiesWeatherUpdate = (e) => {
    updateSettings("cities", { ...cities, showWeather: e.target.checked });
  };
  const handleTasksClearCompleted = () => {
    const updatedTodoList = todo?.todoList.filter((task) => !task.completed);
    updateSettings("todo", { ...todo, todoList: updatedTodoList });
  };
  const handleTasksCompletedUpdate = (e) => {
    updateSettings("todo", { ...todo, showCompleted: e.target.checked });
  };
  const handleTasksDateUpdate = (e) => {
    updateSettings("todo", { ...todo, showDate: e.target.checked });
  };

  const cityList = cities?.cityList || [];

  const items = [
    {
      key: "cities",
      label: "Cities",
      icon: LuGlobe,
      span: 8,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <h2>Cities (up to {MAX_CITIES})</h2>
          </Col>
          <Col span={24}>
            <Select
              showSearch
              value={null}
              placeholder="Search a city to add…"
              style={{ width: "100%" }}
              filterOption={false}
              onSearch={searchCities}
              onChange={addCity}
              notFoundContent={null}
              options={cityResults}
              disabled={cityList.length >= MAX_CITIES}
            />
          </Col>
          <Col span={24}>
            <div className="city-tags">
              {cityList.length === 0 && (
                <span className="note">No cities added.</span>
              )}
              {cityList.map((c, i) => (
                <Tag key={cityKey(c)} closable onClose={() => removeCity(i)}>
                  {typeof c === "object" ? c.name : c}
                </Tag>
              ))}
            </div>
          </Col>
          <Col span={12}>
            <Checkbox
              onChange={handleCitiesClockUpdate}
              checked={cities?.showClock}
            >
              <h3>Show Clock</h3>
            </Checkbox>
          </Col>
          <Col span={12}>
            <Checkbox
              onChange={handleCitiesWeatherUpdate}
              checked={cities?.showWeather}
            >
              <h3>Show Weather</h3>
            </Checkbox>
          </Col>
          <Col span={24}>
            <Segmented
              options={[
                { label: "°C", value: "c" },
                { label: "°F", value: "f" },
              ]}
              value={cities?.unit || "c"}
              onChange={setUnit}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: "todo",
      label: "Todo",
      span: 8,
      icon: LuListTodo,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Checkbox
              onChange={handleTasksCompletedUpdate}
              checked={todo?.showCompleted}
            >
              <h3>Show Completed Tasks</h3>
            </Checkbox>
          </Col>
          <Col span={24}>
            <Checkbox onChange={handleTasksDateUpdate} checked={todo?.showDate}>
              <h3>Show Tasks Insert Date</h3>
            </Checkbox>
          </Col>
          <Col flex={1}>
            <Button
              className={classNames("leftbar-select description")}
              icon={<DeleteOutlined />}
              onClick={handleTasksClearCompleted}
            >
              Clear Completed Tasks
            </Button>
          </Col>
        </Row>
      ),
    },
    {
      key: "chatgpt",
      label: "ChatGPT",
      span: 8,
      icon: RiRobot2Line,
      children: <h2 className="note">Opens ChatGPT in a new tab.</h2>,
    },
    {
      key: "nothing",
      label: "Remove Everything",
      span: 24,
      icon: RxCross2,
      children: <h2 className="note">Everything removed!</h2>,
    },
  ];

  const renderLeftbarItem = ({ key, label, icon, span }, index) => (
    <Col
      key={key}
      className={classNames(
        "animate__animated animate__faster",
        open && "animate__fadeIn"
      )}
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
      span={span}
    >
      <Button
        className={classNames("leftbar-select", leftbar === key && "active")}
        icon={<Icon Component={icon} />}
        onClick={() => handleItemClick(key)}
      >
        {label}
      </Button>
    </Col>
  );

  const renderContent = () => (
    <div
      className={classNames(
        "leftbar-card animate__animated animate__faster animate__fadeIn"
      )}
      style={{
        animationDelay: "0.4s",
      }}
    >
      {items.map(
        ({ key, children }) =>
          key === leftbar && (
            <div
              key={key}
              className={classNames(
                "animate__animated animate__faster animate__fadeIn"
              )}
            >
              {children}
            </div>
          )
      )}
    </div>
  );

  return (
    <Row justify={"space-between"} gutter={[8, 8]}>
      {items.map(renderLeftbarItem)}
      <Col span={24}>{renderContent()}</Col>
    </Row>
  );
}

export default Leftbar;
