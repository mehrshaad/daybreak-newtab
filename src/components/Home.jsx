import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useState } from "react";
import sign from "../assets/images/sign.png";
import { IconBookmark, IconImg } from "../components/Icon";
import "../styles/components/Home.scss";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };
  // document
  //   .querySelector(".ant-input-group-addon")
  //   .addEventListener("click", handleSearch);
  return (
    <>
      <img
        src={sign}
        alt=" "
        className="home-sign"
        onClick={() => window.open("https://github.com/mehrshaad")}
      />
      <div className="home-container" id="home">
        <h1>Have a Good Day!</h1>
        <Input
          className="input-search animate__animated animate__slideInUp"
          placeholder="Search Google..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<SearchOutlined />}
          addonAfter={
            <IconImg src={IconBookmark("google")} onClick={handleSearch} />
          }
          onPressEnter={handleSearch}
          type="search"
        />
      </div>
    </>
  );
}
export default Home;
