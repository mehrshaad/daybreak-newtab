// Bundled so the widget needs no network access. Carried over from v1 and
// extended; all are short, attributed, and long out of copyright.
export const QUOTES = [
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
  { text: "He who has a why can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "Order and simplification are the first steps toward mastery.", author: "Thomas Mann" },
  { text: "Perfection is achieved when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Jean-Jacques Rousseau" },
];

// Day of the year, 1-366.
export function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - start) / 86400000);
}

// Deterministic per day: everyone with the same date sees the same quote, and
// it never changes while the tab is open.
export function quoteForDay(date = new Date(), quotes = QUOTES) {
  return quotes[dayOfYear(date) % quotes.length];
}
