import "animate.css";
import Background from "./components/Background";
import Bookmarks from "./components/Bookmarks";
import City from "./components/City";
import Google from "./components/Google";
import Home from "./components/Home";
import Settings from "./components/Settings";
import Todo from "./components/Todo";
import "./styles/App.scss";
import "./styles/index.scss";

function App() {
  return (
    <>
      <Home />
      <City />
      <Todo />
      <Google />
      <Settings />
      <Bookmarks />
      <Background />
    </>
  );
}

export default App;
