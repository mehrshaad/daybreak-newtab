import { Input } from "antd";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/Widgets.scss";

function Notes() {
  const { settings, updateSettings } = useSettings();
  const [text, setText] = useState(settings.notes?.text || "");
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  if (settings.leftbar !== "notes") return null;

  const save = (value) => updateSettings("notes", { text: value });
  const onChange = (e) => {
    const value = e.target.value;
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), 600);
  };

  return (
    <div className="widget-wrapper animate__animated animate__slideInLeft">
      <div className="widget-container notes-widget">
        <h2>Notes</h2>
        <Input.TextArea
          className="notes-textarea"
          value={text}
          onChange={onChange}
          onBlur={() => save(text)}
          placeholder="Jot something down…"
          autoSize={{ minRows: 12, maxRows: 22 }}
        />
      </div>
    </div>
  );
}

export default Notes;
