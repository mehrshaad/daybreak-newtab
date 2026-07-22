import { Button, Checkbox, Col, Row, Select } from "antd";
import { LuBookmark, LuGlobe, LuListTodo } from "react-icons/lu";
import { DeleteOutlined } from "@ant-design/icons";

import { RiRobot2Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/components/Leftbar.scss";
import { classNames, getTimezone } from "../../utils";
import { Icon } from "../Icon";

function Leftbar({ open }) {
  const { settings, updateSettings } = useSettings();
  const { leftbar, cities, todo } = settings;
  const cityOptions = getTimezone("all", true).map((city) => ({
    value: city,
    label: city,
  }));
  const handleItemClick = (key) => {
    updateSettings("leftbar", key);
  };
  const handleCitiesUpdate = (value) => {
    updateSettings("cities", { ...cities, cityList: value });
  };
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

  const items = [
    {
      key: "cities",
      label: "Cities",
      icon: LuGlobe,
      span: 8,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <h2>Select cities:</h2>
          </Col>
          <Col span={24}>
            <Select
              maxCount={3}
              mode="multiple"
              style={{
                width: "100%",
              }}
              placeholder="Select Cities"
              defaultValue={cities?.cityList}
              onChange={handleCitiesUpdate}
              options={cityOptions}
            />
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
      children: <h2 className="note">Coming Soon!</h2>,
    },
    {
      key: "bookmarks",
      label: "Chrome Bookmarks",
      span: 12,
      icon: LuBookmark,
      children: <h2 className="note">Coming Soon!</h2>,
    },
    {
      key: "nothing",
      label: "Remove Everything",
      span: 12,
      icon: RxCross2,
      children: <h2 className="note">Everyhing Removed!</h2>,
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
