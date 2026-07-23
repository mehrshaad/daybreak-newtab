import { useSettings } from "../context/SettingsContext";
import "../styles/components/Widgets.scss";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "Whether you think you can or you can't, you're right.", author: "Henry Ford" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Do the difficult things while they are easy.", author: "Lao Tzu" },
  { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
];

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function Quote() {
  const {
    settings: { leftbar },
  } = useSettings();

  if (leftbar !== "quote") return null;

  const q = QUOTES[dayOfYear(new Date()) % QUOTES.length];

  return (
    <div className="widget-wrapper animate__animated animate__slideInLeft">
      <div className="widget-container quote-widget">
        <h2>Quote of the Day</h2>
        <p className="quote-text">“{q.text}”</p>
        <p className="quote-author">— {q.author}</p>
      </div>
    </div>
  );
}

export default Quote;
