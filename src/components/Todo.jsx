import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Input,
  Popover,
  Row,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/Todo.scss";
import { classNames, formatDate } from "../utils";

function AddTaskForm({ onAdd }) {
  const [task, setTask] = useState("");
  const [due, setDue] = useState(null);

  const submit = () => {
    if (!task.trim()) return;
    onAdd(task.trim(), due ? due.format("YYYY-MM-DD") : null);
    setTask("");
    setDue(null);
  };

  return (
    <Row className="todo-task-add-popover" justify="center" gutter={[10, 10]}>
      <Col span={24}>
        <Input
          autoFocus
          maxLength={100}
          placeholder="Enter a new task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onPressEnter={submit}
        />
      </Col>
      <Col span={24}>
        <DatePicker
          style={{ width: "100%" }}
          placeholder="Due date (optional)"
          value={due}
          onChange={setDue}
        />
      </Col>
      <Col span={24}>
        <Button block type="primary" icon={<PlusOutlined />} onClick={submit}>
          Add Task
        </Button>
      </Col>
    </Row>
  );
}

function Todo() {
  const [taskPopoverOpen, setTaskPopoverOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const {
    settings: { todo, leftbar },
    updateSettings,
  } = useSettings();
  const { showCompleted, showDate, todoList } = todo;
  const [completedCount, setCompletedCount] = useState(
    todoList.filter((t) => t.completed).length
  );

  useEffect(() => {
    setCompletedCount(todoList.filter((t) => t.completed).length);
  }, [todoList]);

  const today = formatDate(new Date());
  const isOverdue = (t) => t.due && !t.completed && t.due < today;

  const saveList = (list) => updateSettings("todo", { ...todo, todoList: list });

  const handleTodoToggle = (value, taskId) => {
    saveList(
      todoList.map((t) => (t.id === taskId ? { ...t, completed: value } : t))
    );
  };
  const handleAddTodo = (task, due) => {
    if (!task.trim()) return;
    const newTodo = {
      id: crypto.randomUUID(),
      task,
      completed: false,
      date: new Date().toISOString(),
      due: due || null,
    };
    saveList([...todoList, newTodo]);
    setTaskPopoverOpen(false);
  };
  const handleDeleteCompleted = () => {
    saveList(todoList.filter((t) => !t.completed));
  };

  const active = todoList.filter((t) => !t.completed);
  const completed = todoList.filter((t) => t.completed);

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...active];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    saveList([...reordered, ...completed]);
    setDragIndex(null);
  };

  const renderDate = (t) => {
    if (t.due) {
      return (
        <span
          className={classNames("todo-task-date", isOverdue(t) && "overdue")}
        >
          ⏰ {t.due}
        </span>
      );
    }
    if (t.date) {
      return (
        <span
          className={classNames(
            "todo-task-date animate__animated",
            showDate
              ? "animate__fadeIn"
              : "animate__fadeOut animate__faster"
          )}
        >
          ({formatDate(t.date)})
        </span>
      );
    }
    return null;
  };

  return (
    leftbar === "todo" && (
      <div className="todo-wrapper">
        <div className="todo-container animate__animated animate__slideInLeft">
          <div className="todo-header">
            <Col>
              <h2>Todo</h2>
            </Col>
            <Col>
              <h4>
                Count {completedCount}/{todoList.length}
              </h4>
            </Col>
          </div>
          <div className="todo-tasks">
            <Row>
              {active.map((t, i) => (
                <Col span={24} key={t.id}>
                  <div
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => setDragIndex(null)}
                    className={classNames(
                      "todo-task draggable animate__animated animate__slideInLeft animate__faster",
                      showDate && "todo-with-date",
                      dragIndex === i && "dragging"
                    )}
                  >
                    <Checkbox
                      checked={t.completed}
                      onChange={(e) => handleTodoToggle(e.target.checked, t.id)}
                    />
                    <span className="todo-text">{t.task}</span>
                    {renderDate(t)}
                  </div>
                </Col>
              ))}
              {showCompleted && completed.length > 0 && (
                <>
                  <Divider
                    orientation="center"
                    className={classNames(
                      "animate__animated animate__fadeInDown animate__faster"
                    )}
                  >
                    Completed
                  </Divider>
                  {completed.map((t) => (
                    <Col span={24} key={t.id}>
                      <div
                        className={classNames(
                          "todo-task completed animate__animated animate__slideInLeft animate__faster",
                          showDate && "todo-with-date"
                        )}
                      >
                        <Checkbox
                          checked={t.completed}
                          onChange={(e) =>
                            handleTodoToggle(e.target.checked, t.id)
                          }
                        />
                        <span className="todo-text">{t.task}</span>
                        {renderDate(t)}
                      </div>
                    </Col>
                  ))}
                </>
              )}
            </Row>
          </div>
          <Popover
            content={<AddTaskForm onAdd={handleAddTodo} />}
            title="Add New Task"
            destroyTooltipOnHide={true}
            open={taskPopoverOpen}
            color="var(--popover-bg-color)"
            onOpenChange={setTaskPopoverOpen}
            trigger="click"
          >
            <Tooltip title="Add New Task" placement="right">
              <Button
                className={classNames("todo-task-add", taskPopoverOpen && "active")}
                type="primary"
                icon={<PlusOutlined />}
              />
            </Tooltip>
          </Popover>
          <Tooltip title="Clear Completed Tasks" placement="right">
            <Button
              className={classNames("todo-task-clear")}
              type="primary"
              onClick={handleDeleteCompleted}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </div>
      </div>
    )
  );
}

export default Todo;
