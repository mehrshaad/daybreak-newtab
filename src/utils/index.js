export const updateVariable = (variables) => {
  const root = document.querySelector(":root");
  Object.entries(variables).forEach(([variable, value]) => {
    root.style.setProperty(variable, value);
  });
};

export const classNames = (...classes) =>
  classes.filter((className) => className !== undefined).join(" ");

export function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export const getTimezone = (city, returnKeys = false) => {
  const cityToTimezone = {
    Tehran: "Asia/Tehran",
    Toronto: "America/Toronto",
    London: "Europe/London",
    Paris: "Europe/Paris",
    Tokyo: "Asia/Tokyo",
    Sydney: "Australia/Sydney",
    "New York": "America/New_York",
    Moscow: "Europe/Moscow",
    Shanghai: "Asia/Shanghai",
    Mumbai: "Asia/Kolkata",
    Istanbul: "Europe/Istanbul",
    Cairo: "Africa/Cairo",
    "Hong Kong": "Asia/Hong_Kong",
    Vancouver: "America/Vancouver",
    Madrid: "Europe/Madrid",
    Rome: "Europe/Rome",
  };
  if (returnKeys) {
    return Object.keys(cityToTimezone);
  }
  return cityToTimezone[city] || city;
};
// `https://www.google.com/s2/favicons?domain=${url}&sz=${size}`;
export const getIcon = (url, size = "64") => {
  return `https://www.google.com/s2/favicons?domain=${url}&sz=${size}`;
};

export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
