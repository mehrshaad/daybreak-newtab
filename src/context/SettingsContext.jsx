import { createContext, useContext, useEffect, useState } from "react";
import defaultWallpaper from "../assets/backgrounds/1.jpg";
import { IconBookmark } from "../components/Icon";

const SettingsContext = createContext();
const STORAGE_KEY = "daybreakSettings";

const hasChromeSync = () =>
  typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync;

// Storage abstraction. In the packaged extension it uses chrome.storage.sync so
// settings follow the user across devices; running as a plain web page (e.g.
// `npm run dev`) it falls back to localStorage. On first run in the extension it
// migrates any settings previously saved in localStorage.
const storage = {
  get() {
    if (hasChromeSync()) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(STORAGE_KEY, (data) => {
          const synced = data && data[STORAGE_KEY];
          if (synced) {
            resolve(synced);
            return;
          }
          let legacy = null;
          try {
            legacy = JSON.parse(localStorage.getItem(STORAGE_KEY));
          } catch {
            legacy = null;
          }
          if (legacy) chrome.storage.sync.set({ [STORAGE_KEY]: legacy });
          resolve(legacy || {});
        });
      });
    }
    try {
      return Promise.resolve(
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
      );
    } catch {
      return Promise.resolve({});
    }
  },
  set(value) {
    if (hasChromeSync()) {
      chrome.storage.sync.set({ [STORAGE_KEY]: value }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          // e.g. sync quota exceeded — keep a local copy so nothing is lost.
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
          } catch {
            /* ignore */
          }
        }
      });
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

export function SettingsProvider({ children }) {
  const defaultSettings = {
    wallpaper: defaultWallpaper,
    tour: true,
    leftbar: "todo", // cities, todo, nothing
    cities: {
      cityList: [
        {
          name: "Tehran",
          country: "Iran",
          latitude: 35.6944,
          longitude: 51.4215,
          timezone: "Asia/Tehran",
        },
        {
          name: "Toronto",
          country: "Canada",
          latitude: 43.7001,
          longitude: -79.4163,
          timezone: "America/Toronto",
        },
      ],
      showClock: true,
      showWeather: true,
      unit: "c",
    },
    bookmarks: {
      showBookmarks: true,
      showBookmarksLogo: true,
      showBookmarksText: true,
      showBookmarksColors: true,
      bookmarksList: [
        {
          name: "ChatGPT",
          url: "https://chat.openai.com",
          color: "rgba(255, 255, 255, 0.8)",
          icon: IconBookmark("ChatGPT"),
        },
        {
          name: "YouTube",
          url: "https://www.youtube.com",
          color: "rgba(255, 204, 204, 0.8)",
          icon: IconBookmark("YouTube"),
        },
        {
          name: "Github",
          url: "https://github.com",
          color: "rgba(204, 229, 255, 0.8)",
          icon: IconBookmark("Github"),
        },
        {
          name: "LinkedIn",
          url: "https://www.linkedin.com",
          color: "rgba(204, 229, 255, 0.8)",
          icon: IconBookmark("LinkedIn"),
        },
        {
          name: "Telegram",
          url: "https://web.telegram.org",
          color: "rgba(204, 238, 255, 0.8)",
          icon: IconBookmark("Telegram"),
        },
        {
          name: "Reddit",
          url: "https://www.reddit.com",
          color: "rgba(255, 218, 204, 0.8)",
          icon: IconBookmark("Reddit"),
        },
        {
          name: "Dropbox",
          url: "https://www.dropbox.com",
          color: "rgba(204, 221, 255, 0.8)",
          icon: IconBookmark("Dropbox"),
        },
        {
          name: "Mega",
          url: "https://mega.nz",
          color: "rgba(255, 204, 204, 0.8)",
          icon: IconBookmark("Mega"),
        },
      ],
    },
    todo: {
      showCompleted: true,
      showDate: true,
      todoList: [
        {
          id: "1a2b3c4e-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
          task: "Visit my github page!",
          completed: false,
          date: new Date().toISOString().split("T")[0],
        },
        {
          id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
          task: "Visit my linkedin page!",
          completed: false,
          date: new Date().toISOString().split("T")[0],
        },
        {
          id: "1a2b3c4r-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
          task: "Visit my website!",
          completed: false,
          date: new Date().toISOString().split("T")[0],
        },
        {
          id: "2b3d4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
          task: "Install this extension!",
          completed: true,
          date: new Date().toISOString().split("T")[0],
        },
      ],
    },
  };

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    storage.get().then((saved) => {
      if (active) setSettings({ ...defaultSettings, ...saved });
    });
    return () => {
      active = false;
    };
    // Load once on mount; defaultSettings is only used to seed missing keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSettings = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      storage.set(next);
      return next;
    });
  };

  // Wait for stored settings to load before rendering the page.
  if (!settings) return null;

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
