import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useEffect, useRef, useState } from "react";
import sign from "../assets/images/sign.png";
import IconTile from "./IconTile";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/Home.scss";
import { greeting, SEARCH_ENGINES } from "../utils";

function Home() {
  const {
    settings: { general },
  } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  const engineKey = general?.searchEngine || "google";
  const engine = SEARCH_ENGINES[engineKey] || SEARCH_ENGINES.google;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      window.location.href = engine.url + encodeURIComponent(q);
    }
  };

  return (
    <>
      <img
        src={sign}
        alt=" "
        className="home-sign"
        onClick={() => window.open("https://github.com/mehrshaad")}
      />
      <div className="home-container" id="home">
        <h1>{greeting(general?.name)}</h1>
        <Input
          ref={inputRef}
          className="input-search animate__animated animate__slideInUp"
          placeholder={`Search ${engine.label}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<SearchOutlined />}
          addonAfter={
            <span
              className="search-go"
              role="button"
              tabIndex={0}
              aria-label={`Search ${engine.label}`}
              onClick={handleSearch}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && handleSearch()
              }
            >
              <IconTile name={engineKey} size={26} />
            </span>
          }
          onPressEnter={handleSearch}
          type="search"
          aria-label="Search the web"
        />
      </div>
    </>
  );
}
export default Home;
