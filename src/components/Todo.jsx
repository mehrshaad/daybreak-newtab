import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
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

function Todo() {
  const [taskPopoverOpen, setTaskPopoverOpen] = useState(false);
  const {
    settings: { todo, leftbar },
    updateSettings,
  } = useSettings();
  const { showCompleted, showDate, todoList } = todo;
  const [completedCount, setCompletedCount] = useState(
    todoList.filter((todo) => todo.completed).length
  );

  useEffect(() => {
    setCompletedCount(todoList.filter((todo) => todo.completed).length);
  }, [todoList]);

  const handleTodoToggle = (value, taskId) => {
    const updatedTodoList = todoList.map((todo) =>
      todo.id === taskId ? { ...todo, completed: value } : todo
    );
    updateSettings("todo", {
      ...todo,
      todoList: updatedTodoList,
    });
  };
  const handleAddTodo = (task) => {
    if (!task.trim()) return;
    const newTodo = {
      id: crypto.randomUUID(),
      task,
      completed: false,
      date: new Date().toISOString(),
    };
    updateSettings("todo", {
      ...todo,
      todoList: [...todoList, newTodo],
    });
    setTaskPopoverOpen(false);
  };
  const handleDeleteCompleted = () => {
    const updatedTodoList = todoList.filter((todo) => !todo.completed);
    updateSettings("todo", {
      ...todo,
      todoList: updatedTodoList,
    });
  };
  const addNewTask = () => {
    return (
      <Row className="todo-task-add-popover" justify="center" gutter={[10, 10]}>
        <Input
          ref={(input) => input && input.focus()}
          maxLength={100}
          name="todoInput"
          placeholder="Enter a new task..."
          onPressEnter={(e) => handleAddTodo(e.target.value)}
        />
        <Button
          block
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            const input = document.getElementsByName("todoInput")[0];
            handleAddTodo(input.value);
          }}
        >
          Add Task
        </Button>
      </Row>
    );
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
              {todoList
                .filter((todo) => !todo.completed)
                .map((todo) => (
                  <Col span={24} key={todo.id}>
                    <div
                      className={classNames(
                        "todo-task animate__animated animate__slideInLeft animate__faster",
                        showDate && "todo-with-date"
                      )}
                    >
                      <Checkbox
                        checked={todo.completed}
                        onChange={(e) =>
                          handleTodoToggle(e.target.checked, todo.id)
                        }
                      />
                      <span className="todo-text">{todo.task}</span>
                      {todo.date && (
                        <span
                          className={classNames(
                            "todo-task-date animate__animated",
                            showDate
                              ? "animate__fadeIn"
                              : "animate__fadeOut animate__faster"
                          )}
                        >
                          ({formatDate(todo.date)})
                        </span>
                      )}
                    </div>
                  </Col>
                ))}
              {showCompleted && todoList.some((todo) => todo.completed) && (
                <>
                  <Divider
                    orientation="center"
                    className={classNames(
                      "animate__animated animate__fadeInDown animate__faster"
                    )}
                  >
                    Completed
                  </Divider>
                  {todoList
                    .filter((todo) => todo.completed)
                    .map((todo) => (
                      <Col span={24} key={todo.id}>
                        <div
                          className={classNames(
                            "todo-task completed animate__animated animate__slideInLeft animate__faster",
                            showDate && "todo-with-date"
                          )}
                        >
                          <Checkbox
                            checked={todo.completed}
                            onChange={(e) =>
                              handleTodoToggle(e.target.checked, todo.id)
                            }
                          />
                          <span className="todo-text">{todo.task}</span>
                          {todo.date && (
                            <span
                              className={classNames(
                                "todo-task-date animate__animated",
                                showDate
                                  ? "animate__fadeIn"
                                  : "animate__fadeOut animate__faster"
                              )}
                            >
                              ({formatDate(todo.date)})
                            </span>
                          )}
                        </div>
                      </Col>
                    ))}
                </>
              )}
            </Row>
          </div>
          <Popover
            content={addNewTask}
            title="Add New Task"
            destroyTooltipOnHide={true}
            open={taskPopoverOpen}
            color="var(--popover-bg-color)"
            onOpenChange={setTaskPopoverOpen}
            trigger="click"
          >
            <Tooltip title="Add New Task" placement="right">
              <Button
                className={classNames(
                  "todo-task-add",
                  taskPopoverOpen && "active"
                )}
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
