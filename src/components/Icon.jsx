import chatgpt from "../assets/bookmarks/chatgpt.png";
import dropbox from "../assets/bookmarks/dropbox.png";
import github from "../assets/bookmarks/github.png";
import google from "../assets/bookmarks/google.png";
import instagram from "../assets/bookmarks/instagram.png";
import linkedin from "../assets/bookmarks/linkedin.png";
import mega from "../assets/bookmarks/mega.png";
import netflix from "../assets/bookmarks/netflix.png";
import reddit from "../assets/bookmarks/reddit.png";
import favorite from "../assets/bookmarks/star.png";
import telegram from "../assets/bookmarks/telegram.png";
import whatsapp from "../assets/bookmarks/whatsapp.png";
import x from "../assets/bookmarks/x.png";
import account from "../assets/google/account.png";
import books from "../assets/google/books.png";
import calendar from "../assets/google/calendar.png";
import classroom from "../assets/google/classroom.png";
import colab from "../assets/google/colab.png";
import contacts from "../assets/google/contacts.png";
import docs from "../assets/google/docs.png";
import drawing from "../assets/google/drawing.png";
import drive from "../assets/google/drive.png";
import forms from "../assets/google/forms.png";
import gmail from "../assets/google/gmail.png";
import jamboard from "../assets/google/jamboard.png";
import keep from "../assets/google/keep.png";
import maps from "../assets/google/maps.png";
import meet from "../assets/google/meet.png";
import passwords from "../assets/google/passwords.png";
import photos from "../assets/google/photos.png";
import play from "../assets/google/play.png";
import playgames from "../assets/google/playgames.png";
import scholar from "../assets/google/scholar.png";
import sheets from "../assets/google/sheets.png";
import slides from "../assets/google/slides.png";
import translate from "../assets/google/translate.png";
import youtube from "../assets/google/youtube.png";
import clear_day from "../assets/weather/clear_day.png";
import clear_night from "../assets/weather/clear_night.png";
import clouds_day from "../assets/weather/clouds_day.png";
import clouds_night from "../assets/weather/clouds_night.png";
import drizzle from "../assets/weather/drizzle.png";
import dust from "../assets/weather/dust.png";
import fog from "../assets/weather/fog.png";
import haze from "../assets/weather/haze.png";
import mist from "../assets/weather/mist.png";
import night from "../assets/weather/night.png";
import rain from "../assets/weather/rain.png";
import sand from "../assets/weather/sand.png";
import smoke from "../assets/weather/smoke.png";
import snow from "../assets/weather/snow.png";
import squall from "../assets/weather/squall.png";
import thunderstorm from "../assets/weather/thunderstorm.png";
import tornado from "../assets/weather/tornado.png";

function Icon({ Component, className }) {
  return (
    <div className={"anticon"}>
      <Component className={className} />
    </div>
  );
}
function IconImg({ src, className, onClick }) {
  return (
    <div className={"anticon"} onClick={onClick}>
      <img src={src} className={className} />
    </div>
  );
}
function IconBookmark(bookmark) {
  const bookmarkIcon = {
    youtube: youtube,
    gmail: gmail,
    "google maps": maps,
    "google drive": drive,
    "google translate": translate,
    "google photos": photos,
    "google calendar": calendar,
    "google docs": docs,
    "google play": play,
    "google meet": meet,
    "google sheets": sheets,
    "google slides": slides,
    "google classroom": classroom,
    "google scholar": scholar,
    "google books": books,
    "google forms": forms,
    "google keep": keep,
    "google contacts": contacts,
    "google passwords": passwords,
    "play games": playgames,
    "google colab": colab,
    jamboard: jamboard,
    favorite: favorite,
    google: google,
    github: github,
    chatgpt: chatgpt,
    "mega nz": mega,
    mega: mega,
    dropbox: dropbox,
    instagram: instagram,
    linkedin: linkedin,
    netflix: netflix,
    reddit: reddit,
    telegram: telegram,
    twitter: x,
    x: x,
    whatsapp: whatsapp,
  };

  const bookmarkName = bookmark.toLowerCase();
  return bookmarkIcon[bookmarkName] || false;
}
function IconWeather({ weatherCondition, day }) {
  const weatherIcons = {
    snow: snow,
    clear: day ? clear_day : clear_night,
    clouds: day ? clouds_day : clouds_night,
    drizzle: drizzle,
    dust: dust,
    fog: fog,
    haze: haze,
    mist: mist,
    rain: rain,
    sand: sand,
    smoke: smoke,
    squall: squall,
    tornado: tornado,
    thunderstorm: thunderstorm,
  };

  const condition = weatherCondition.toLowerCase();
  const iconSrc = weatherIcons[condition] || (day ? day : night);

  return (
    <div className={"anticon"}>
      <img src={iconSrc} className={"icon"} />
    </div>
  );
}
function IconGoogle() {
  const googleIcons = {
    account: { icon: account, link: "https://myaccount.google.com/" },
    youtube: { icon: youtube, link: "https://www.youtube.com/" },
    gmail: { icon: gmail, link: "https://mail.google.com/" },
    maps: { icon: maps, link: "https://maps.google.com/" },
    drive: { icon: drive, link: "https://drive.google.com/" },
    translate: { icon: translate, link: "https://translate.google.com/" },
    photos: { icon: photos, link: "https://photos.google.com/" },
    calendar: { icon: calendar, link: "https://calendar.google.com/" },
    docs: { icon: docs, link: "https://docs.google.com/" },
    play: { icon: play, link: "https://play.google.com/" },
    meet: { icon: meet, link: "https://meet.google.com/" },
    sheets: { icon: sheets, link: "https://sheets.google.com/" },
    slides: { icon: slides, link: "https://slides.google.com/" },
    classroom: { icon: classroom, link: "https://classroom.google.com/" },
    scholar: { icon: scholar, link: "https://scholar.google.com/" },
    books: { icon: books, link: "https://books.google.com/" },
    forms: { icon: forms, link: "https://forms.google.com/" },
    keep: { icon: keep, link: "https://keep.google.com/" },
    contacts: { icon: contacts, link: "https://contacts.google.com/" },
    passwords: { icon: passwords, link: "https://passwords.google.com/" },
    "play games": { icon: playgames, link: "https://play.google.com/games" },
    colab: { icon: colab, link: "https://colab.research.google.com/" },
    drawing: { icon: drawing, link: "https://docs.google.com/drawings/" },
    jamboard: { icon: jamboard, link: "https://jamboard.google.com/" },
  };

  return Object.entries(googleIcons).map(([app, { icon, link }]) => (
    <div key={app} className={"app"}>
      <div onClick={() => window.open(link, "_self", "noopener,noreferrer")}>
        <div className={"anticon"}>
          <img src={icon} className={"icon"} />
        </div>
        <div className={"text"}>{app}</div>
      </div>
    </div>
  ));
}

export { Icon, IconBookmark, IconGoogle, IconImg, IconWeather };

