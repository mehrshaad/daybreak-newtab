import {
  Si1Password,
  SiAirbnb,
  SiAirtable,
  SiAlibabadotcom,
  SiAliexpress,
  SiAmazon,
  SiAnki,
  SiAnthropic,
  SiApple,
  SiApplemusic,
  SiArc,
  SiArstechnica,
  SiArxiv,
  SiAsana,
  SiAudible,
  SiBaidu,
  SiBandcamp,
  SiBehance,
  SiBinance,
  SiBitbucket,
  SiBitwarden,
  SiBluesky,
  SiBrave,
  SiBuymeacoffee,
  SiCanva,
  SiCashapp,
  SiChessdotcom,
  SiCircleci,
  SiClaude,
  SiClickup,
  SiCloudflare,
  SiCnn,
  SiCodecademy,
  SiCodepen,
  SiCodesandbox,
  SiCoinbase,
  SiConfluence,
  SiCoursera,
  SiCrunchyroll,
  SiDatacamp,
  SiDevdotto,
  SiDigitalocean,
  SiDiscord,
  SiDocker,
  SiDribbble,
  SiDropbox,
  SiDuolingo,
  SiEa,
  SiEbay,
  SiEdx,
  SiElasticsearch,
  SiElevenlabs,
  SiEpicgames,
  SiEtsy,
  SiEvernote,
  SiFacebook,
  SiFigma,
  SiFirebase,
  SiFirefox,
  SiFiverr,
  SiFreecodecamp,
  SiGhost,
  SiGithub,
  SiGithubcopilot,
  SiGitlab,
  SiGmail,
  SiGo,
  SiGoodreads,
  SiGoogle,
  SiGoogleanalytics,
  SiGooglecalendar,
  SiGooglechat,
  SiGooglechrome,
  SiGoogleclassroom,
  SiGooglecloud,
  SiGooglecolab,
  SiGoogledocs,
  SiGoogledrive,
  SiGoogleearth,
  SiGooglefit,
  SiGooglefonts,
  SiGoogleforms,
  SiGooglegemini,
  SiGooglehome,
  SiGooglekeep,
  SiGooglelens,
  SiGooglemaps,
  SiGooglemeet,
  SiGooglemessages,
  SiGooglenews,
  SiGooglepay,
  SiGooglephotos,
  SiGoogleplay,
  SiGooglescholar,
  SiGooglesheets,
  SiGoogleslides,
  SiGoogletasks,
  SiGoogletranslate,
  SiGrammarly,
  SiGraphql,
  SiHackerrank,
  SiHashnode,
  SiHbo,
  SiHeroku,
  SiHubspot,
  SiHuggingface,
  SiImdb,
  SiInstagram,
  SiItchdotio,
  SiJellyfin,
  SiJenkins,
  SiJira,
  SiJupyter,
  SiKaggle,
  SiKhanacademy,
  SiKofi,
  SiKubernetes,
  SiLeetcode,
  SiLetterboxd,
  SiLichess,
  SiLine,
  SiLinear,
  SiLinkedin,
  SiLogseq,
  SiMailchimp,
  SiMastodon,
  SiMdnwebdocs,
  SiMedium,
  SiMega,
  SiMessenger,
  SiMiro,
  SiMongodb,
  SiMysql,
  SiNamecheap,
  SiNetflix,
  SiNetlify,
  SiNintendo,
  SiNodedotjs,
  SiNordvpn,
  SiNotion,
  SiNpm,
  SiObsidian,
  SiOllama,
  SiOpenai,
  SiOpera,
  SiOverleaf,
  SiPatreon,
  SiPaypal,
  SiPerplexity,
  SiPinterest,
  SiPlaystation,
  SiPlex,
  SiPluralsight,
  SiPostgresql,
  SiPostman,
  SiPrimevideo,
  SiPrisma,
  SiProtonmail,
  SiPython,
  SiQuora,
  SiRailway,
  SiRaycast,
  SiReact,
  SiReddit,
  SiRedis,
  SiRender,
  SiReplit,
  SiRevolut,
  SiRobinhood,
  SiRoblox,
  SiRust,
  SiSafari,
  SiSalesforce,
  SiSentry,
  SiShopify,
  SiSignal,
  SiSkillshare,
  SiSlack,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiStackblitz,
  SiStackexchange,
  SiStackoverflow,
  SiSteam,
  SiStrava,
  SiStripe,
  SiSubstack,
  SiSupabase,
  SiTechcrunch,
  SiTelegram,
  SiTerraform,
  SiTheguardian,
  SiThreads,
  SiTidal,
  SiTiktok,
  SiTodoist,
  SiTradingview,
  SiTrello,
  SiTripadvisor,
  SiTumblr,
  SiTwitch,
  SiTypescript,
  SiUber,
  SiUbisoft,
  SiUdemy,
  SiUnsplash,
  SiUpwork,
  SiVenmo,
  SiVercel,
  SiViber,
  SiVimeo,
  SiVk,
  SiVuedotjs,
  SiWalmart,
  SiWebflow,
  SiWechat,
  SiWhatsapp,
  SiWikipedia,
  SiWise,
  SiWordpress,
  SiX,
  SiYcombinator,
  SiYoutube,
  SiZapier,
  SiZoho,
  SiZoom,
  SiZotero,
} from "react-icons/si";
import { SiDuckduckgo, SiMicrosoftbing } from "./components/brandIcons";

// name -> { Glyph, from, to }. Every entry is a real brand mark: react-icons
// where it has one, and a bundled CC0 Simple Icons path where it does not
// (Bing). Nothing here is a generic stand-in — an app with no authentic mark is
// left out of the launcher rather than given a borrowed icon.
//
// The gradient and tile are the Daybreak treatment; the glyph is the brand's.
export const BRANDS = {
  // shortcuts
  chatgpt: { Glyph: SiOpenai, from: "#1fbf9c", to: "#0d8a68" },
  openai: { Glyph: SiOpenai, from: "#1fbf9c", to: "#0d8a68" },
  youtube: { Glyph: SiYoutube, from: "#ff5a5a", to: "#e00000" },
  github: { Glyph: SiGithub, from: "#5b5b5b", to: "#1a1a1a" },
  linkedin: { Glyph: SiLinkedin, from: "#2b8fd6", to: "#0a66c2" },
  telegram: { Glyph: SiTelegram, from: "#37bbfe", to: "#1f96d4" },
  reddit: { Glyph: SiReddit, from: "#ff7a45", to: "#ff4500" },
  dropbox: { Glyph: SiDropbox, from: "#3d86ff", to: "#0061ff" },
  mega: { Glyph: SiMega, from: "#ff5b5b", to: "#d9272e" },
  instagram: { Glyph: SiInstagram, from: "#f9807d", to: "#c913b9" },
  whatsapp: { Glyph: SiWhatsapp, from: "#4ce072", to: "#25d366" },
  netflix: { Glyph: SiNetflix, from: "#ff4d57", to: "#e50914" },
  spotify: { Glyph: SiSpotify, from: "#4ce072", to: "#1db954" },
  notion: { Glyph: SiNotion, from: "#5c5c5c", to: "#0f0f0f" },
  slack: { Glyph: SiSlack, from: "#5fd0a8", to: "#4a154b" },
  x: { Glyph: SiX, from: "#3a3a3a", to: "#000000" },
  twitter: { Glyph: SiX, from: "#3a3a3a", to: "#000000" },
  // Apple has no single per-service mark in Simple Icons — this is the
  // company logo, used as the stand-in for iCloud-sourced content.
  icloud: { Glyph: SiApple, from: "#8e8e93", to: "#1d1d1f" },

  // search engines
  google: { Glyph: SiGoogle, from: "#5a9bff", to: "#3d6fe0" },
  duckduckgo: { Glyph: SiDuckduckgo, from: "#ff7a4d", to: "#de5833" },
  bing: { Glyph: SiMicrosoftbing, from: "#4aa8ff", to: "#0f6cbd" },

  // google apps
  gmail: { Glyph: SiGmail, from: "#ff6a5b", to: "#e0392b" },
  drive: { Glyph: SiGoogledrive, from: "#ffd24d", to: "#f4b400" },
  calendar: { Glyph: SiGooglecalendar, from: "#5a9bff", to: "#4285f4" },
  meet: { Glyph: SiGooglemeet, from: "#3fbf70", to: "#00897b" },
  chat: { Glyph: SiGooglechat, from: "#3fbf70", to: "#00ac47" },
  messages: { Glyph: SiGooglemessages, from: "#5a9bff", to: "#1a73e8" },
  docs: { Glyph: SiGoogledocs, from: "#5a9bff", to: "#2a72e0" },
  sheets: { Glyph: SiGooglesheets, from: "#3fbf70", to: "#0f9d58" },
  slides: { Glyph: SiGoogleslides, from: "#ffcf4d", to: "#f4b400" },
  forms: { Glyph: SiGoogleforms, from: "#9b6bd6", to: "#7248b9" },
  keep: { Glyph: SiGooglekeep, from: "#ffe14d", to: "#fbbc04" },
  tasks: { Glyph: SiGoogletasks, from: "#5a9bff", to: "#2478f3" },
  photos: { Glyph: SiGooglephotos, from: "#5a9bff", to: "#4285f4" },
  maps: { Glyph: SiGooglemaps, from: "#5aa85f", to: "#34a853" },
  earth: { Glyph: SiGoogleearth, from: "#5a9bff", to: "#4285f4" },
  lens: { Glyph: SiGooglelens, from: "#5a9bff", to: "#4285f4" },
  translate: { Glyph: SiGoogletranslate, from: "#5a9bff", to: "#4285f4" },
  news: { Glyph: SiGooglenews, from: "#5a9bff", to: "#4285f4" },
  play: { Glyph: SiGoogleplay, from: "#4fd6c4", to: "#00b3a6" },
  classroom: { Glyph: SiGoogleclassroom, from: "#5aa85f", to: "#0f9d58" },
  scholar: { Glyph: SiGooglescholar, from: "#5a9bff", to: "#4285f4" },
  colab: { Glyph: SiGooglecolab, from: "#ffba4d", to: "#f9ab00" },
  gemini: { Glyph: SiGooglegemini, from: "#a78fd0", to: "#8e75b2" },
  chrome: { Glyph: SiGooglechrome, from: "#5a9bff", to: "#4285f4" },
  home: { Glyph: SiGooglehome, from: "#5aa85f", to: "#34a853" },
  fit: { Glyph: SiGooglefit, from: "#5a9bff", to: "#4285f4" },
  pay: { Glyph: SiGooglepay, from: "#5a9bff", to: "#4285f4" },
  analytics: { Glyph: SiGoogleanalytics, from: "#ffba4d", to: "#e8710a" },
  cloud: { Glyph: SiGooglecloud, from: "#5a9bff", to: "#4285f4" },
  fonts: { Glyph: SiGooglefonts, from: "#5a9bff", to: "#4285f4" },
  // The Google G is the authentic mark for the account entry itself.
  account: { Glyph: SiGoogle, from: "#5a9bff", to: "#3d6fe0" },


  // social and messaging
  facebook: { Glyph: SiFacebook, from: "#488eff", to: "#0866ff" },
  messenger: { Glyph: SiMessenger, from: "#42c6ff", to: "#00b2ff" },
  tiktok: { Glyph: SiTiktok, from: "#424242", to: "#000000" },
  snapchat: { Glyph: SiSnapchat, from: "#fffd42", to: "#fffc00" },
  pinterest: { Glyph: SiPinterest, from: "#ce4857", to: "#bd081c" },
  tumblr: { Glyph: SiTumblr, from: "#6a7687", to: "#36465d" },
  mastodon: { Glyph: SiMastodon, from: "#8c8cff", to: "#6364ff" },
  threads: { Glyph: SiThreads, from: "#424242", to: "#000000" },
  bluesky: { Glyph: SiBluesky, from: "#44a5ff", to: "#0285ff" },
  discord: { Glyph: SiDiscord, from: "#838df5", to: "#5865f2" },
  signal: { Glyph: SiSignal, from: "#6d9af4", to: "#3a76f0" },
  wechat: { Glyph: SiWechat, from: "#47d189", to: "#07c160" },
  line: { Glyph: SiLine, from: "#42d342", to: "#00c300" },
  viber: { Glyph: SiViber, from: "#9789f5", to: "#7360f2" },
  vk: { Glyph: SiVk, from: "#429aff", to: "#0077ff" },

  // media and streaming
  twitch: { Glyph: SiTwitch, from: "#ae76ff", to: "#9146ff" },
  vimeo: { Glyph: SiVimeo, from: "#56caef", to: "#1ab7ea" },
  soundcloud: { Glyph: SiSoundcloud, from: "#ff8142", to: "#ff5500" },
  applemusic: { Glyph: SiApplemusic, from: "#fb5d6f", to: "#fa243c" },
  tidal: { Glyph: SiTidal, from: "#424242", to: "#000000" },
  bandcamp: { Glyph: SiBandcamp, from: "#72a3b0", to: "#408294" },
  crunchyroll: { Glyph: SiCrunchyroll, from: "#f7995b", to: "#f47521" },
  primevideo: { Glyph: SiPrimevideo, from: "#42bfe9", to: "#00a8e1" },
  plex: { Glyph: SiPlex, from: "#f0c442", to: "#ebaf00" },
  jellyfin: { Glyph: SiJellyfin, from: "#42bce5", to: "#00a4dc" },

  // shopping and travel
  amazon: { Glyph: SiAmazon, from: "#ffb442", to: "#ff9900" },
  ebay: { Glyph: SiEbay, from: "#ec676c", to: "#e53238" },
  aliexpress: { Glyph: SiAliexpress, from: "#ff7777", to: "#ff4747" },
  airbnb: { Glyph: SiAirbnb, from: "#ff8589", to: "#ff5a5f" },
  uber: { Glyph: SiUber, from: "#424242", to: "#000000" },
  tripadvisor: { Glyph: SiTripadvisor, from: "#69e8b9", to: "#34e0a1" },

  // development
  stackoverflow: { Glyph: SiStackoverflow, from: "#f8a15e", to: "#f58025" },
  stackexchange: { Glyph: SiStackexchange, from: "#5980b2", to: "#1e5397" },
  gitlab: { Glyph: SiGitlab, from: "#fd935e", to: "#fc6d26" },
  bitbucket: { Glyph: SiBitbucket, from: "#427fd9", to: "#0052cc" },
  npm: { Glyph: SiNpm, from: "#d96c6b", to: "#cb3837" },
  docker: { Glyph: SiDocker, from: "#5db1f2", to: "#2496ed" },
  kubernetes: { Glyph: SiKubernetes, from: "#6792ec", to: "#326ce5" },
  vercel: { Glyph: SiVercel, from: "#424242", to: "#000000" },
  netlify: { Glyph: SiNetlify, from: "#42d6ca", to: "#00c7b7" },
  cloudflare: { Glyph: SiCloudflare, from: "#f6a15a", to: "#f38020" },
  digitalocean: { Glyph: SiDigitalocean, from: "#42a1ff", to: "#0080ff" },
  heroku: { Glyph: SiHeroku, from: "#7442b3", to: "#430098" },
  mongodb: { Glyph: SiMongodb, from: "#77ba78", to: "#47a248" },
  postgresql: { Glyph: SiPostgresql, from: "#7290e9", to: "#4169e1" },
  redis: { Glyph: SiRedis, from: "#ff756c", to: "#ff4438" },
  supabase: { Glyph: SiSupabase, from: "#71dbab", to: "#3fcf8e" },
  firebase: { Glyph: SiFirebase, from: "#e66342", to: "#dd2c00" },
  codepen: { Glyph: SiCodepen, from: "#424242", to: "#000000" },
  codesandbox: { Glyph: SiCodesandbox, from: "#525252", to: "#151515" },
  leetcode: { Glyph: SiLeetcode, from: "#ffb953", to: "#ffa116" },
  hackerrank: { Glyph: SiHackerrank, from: "#42ef8c", to: "#00ea64" },
  kaggle: { Glyph: SiKaggle, from: "#5acfff", to: "#20beff" },
  jupyter: { Glyph: SiJupyter, from: "#f69a5e", to: "#f37626" },

  // work and planning
  jira: { Glyph: SiJira, from: "#427fd9", to: "#0052cc" },
  confluence: { Glyph: SiConfluence, from: "#53627b", to: "#172b4d" },
  trello: { Glyph: SiTrello, from: "#427fd9", to: "#0052cc" },
  asana: { Glyph: SiAsana, from: "#f49191", to: "#f06a6a" },
  clickup: { Glyph: SiClickup, from: "#9d8ff2", to: "#7b68ee" },
  linear: { Glyph: SiLinear, from: "#8891de", to: "#5e6ad2" },
  figma: { Glyph: SiFigma, from: "#f57c59", to: "#f24e1e" },
  canva: { Glyph: SiCanva, from: "#42d3d9", to: "#00c4cc" },
  miro: { Glyph: SiMiro, from: "#ffdc65", to: "#ffd02f" },
  airtable: { Glyph: SiAirtable, from: "#54d0ff", to: "#18bfff" },
  zapier: { Glyph: SiZapier, from: "#ff7d42", to: "#ff4f00" },
  zoom: { Glyph: SiZoom, from: "#4a86ff", to: "#0b5cff" },
  obsidian: { Glyph: SiObsidian, from: "#9e6df2", to: "#7c3aed" },
  todoist: { Glyph: SiTodoist, from: "#eb7467", to: "#e44332" },
  evernote: { Glyph: SiEvernote, from: "#42bf64", to: "#00a82d" },
  grammarly: { Glyph: SiGrammarly, from: "#44a094", to: "#027e6f" },
  dribbble: { Glyph: SiDribbble, from: "#ef7ba8", to: "#ea4c89" },
  behance: { Glyph: SiBehance, from: "#5390ff", to: "#1769ff" },

  // reading and reference
  wikipedia: { Glyph: SiWikipedia, from: "#8c8c8e", to: "#636466" },
  medium: { Glyph: SiMedium, from: "#424242", to: "#000000" },
  substack: { Glyph: SiSubstack, from: "#ff8f55", to: "#ff6719" },
  devto: { Glyph: SiDevdotto, from: "#4a4a4a", to: "#0a0a0a" },
  hashnode: { Glyph: SiHashnode, from: "#618bff", to: "#2962ff" },
  quora: { Glyph: SiQuora, from: "#cb625f", to: "#b92b27" },
  goodreads: { Glyph: SiGoodreads, from: "#6b5b50", to: "#372213" },
  imdb: { Glyph: SiImdb, from: "#f8d454", to: "#f5c518" },
  letterboxd: { Glyph: SiLetterboxd, from: "#42e16a", to: "#00d735" },
  arxiv: { Glyph: SiArxiv, from: "#c75656", to: "#b31b1b" },
  overleaf: { Glyph: SiOverleaf, from: "#77b972", to: "#47a141" },
  ycombinator: { Glyph: SiYcombinator, from: "#f48d65", to: "#f0652f" },

  // money
  paypal: { Glyph: SiPaypal, from: "#4266a6", to: "#003087" },
  stripe: { Glyph: SiStripe, from: "#8c86ff", to: "#635bff" },
  wise: { Glyph: SiWise, from: "#b8ee95", to: "#9fe870" },
  revolut: { Glyph: SiRevolut, from: "#555759", to: "#191c1f" },
  coinbase: { Glyph: SiCoinbase, from: "#427fff", to: "#0052ff" },
  binance: { Glyph: SiBinance, from: "#f4cb4a", to: "#f0b90b" },

  // learning
  duolingo: { Glyph: SiDuolingo, from: "#83d944", to: "#58cc02" },
  coursera: { Glyph: SiCoursera, from: "#4282de", to: "#0056d2" },
  udemy: { Glyph: SiUdemy, from: "#bc6af4", to: "#a435f0" },
  khanacademy: { Glyph: SiKhanacademy, from: "#51d0b1", to: "#14bf96" },
  edx: { Glyph: SiEdx, from: "#445e62", to: "#02262b" },

  // games
  steam: { Glyph: SiSteam, from: "#53565b", to: "#171a21" },
  epicgames: { Glyph: SiEpicgames, from: "#676767", to: "#313131" },
  playstation: { Glyph: SiPlaystation, from: "#426bae", to: "#003791" },
  nintendo: { Glyph: SiNintendo, from: "#ed4250", to: "#e60012" },
  itch: { Glyph: SiItchdotio, from: "#fb8686", to: "#fa5c5c" },

  // ai
  claude: { Glyph: SiClaude, from: "#e39a83", to: "#d97757" },
  anthropic: { Glyph: SiAnthropic, from: "#555555", to: "#191919" },
  perplexity: { Glyph: SiPerplexity, from: "#59cada", to: "#1fb8cd" },
  huggingface: { Glyph: SiHuggingface, from: "#ffde59", to: "#ffd21e" },

  // browsers and mail
  brave: { Glyph: SiBrave, from: "#fc8062", to: "#fb542b" },
  firefox: { Glyph: SiFirefox, from: "#ff966c", to: "#ff7139" },
  opera: { Glyph: SiOpera, from: "#ff5664", to: "#ff1b2d" },
  safari: { Glyph: SiSafari, from: "#4292ff", to: "#006cff" },
  protonmail: { Glyph: SiProtonmail, from: "#9379ff", to: "#6d4aff" },
  zoho: { Glyph: SiZoho, from: "#eb5e5f", to: "#e42527" },

  // creators
  patreon: { Glyph: SiPatreon, from: "#424242", to: "#000000" },
  kofi: { Glyph: SiKofi, from: "#ff8886", to: "#ff5e5b" },
  buymeacoffee: { Glyph: SiBuymeacoffee, from: "#ffe642", to: "#ffdd00" },
  unsplash: { Glyph: SiUnsplash, from: "#424242", to: "#000000" },

  // shopping
  shopify: { Glyph: SiShopify, from: "#a3d977", to: "#7ab55c" },
  etsy: { Glyph: SiEtsy, from: "#ff8c47", to: "#f16521" },
  walmart: { Glyph: SiWalmart, from: "#3f8fe0", to: "#0071ce" },
  alibaba: { Glyph: SiAlibabadotcom, from: "#ff8c47", to: "#ff6a00" },

  // work
  salesforce: { Glyph: SiSalesforce, from: "#4aa3e8", to: "#00a1e0" },
  hubspot: { Glyph: SiHubspot, from: "#ff8f59", to: "#ff7a59" },
  mailchimp: { Glyph: SiMailchimp, from: "#ffe45e", to: "#ffe01b" },
  fiverr: { Glyph: SiFiverr, from: "#2fd07a", to: "#1dbf73" },
  upwork: { Glyph: SiUpwork, from: "#3ecf6a", to: "#14a800" },

  // code
  python: { Glyph: SiPython, from: "#4b8bbe", to: "#306998" },
  react: { Glyph: SiReact, from: "#7fdbf5", to: "#61dafb" },
  vuejs: { Glyph: SiVuedotjs, from: "#5fd3a0", to: "#42b883" },
  nodejs: { Glyph: SiNodedotjs, from: "#7dc94f", to: "#5fa04e" },
  rust: { Glyph: SiRust, from: "#7a6a5f", to: "#000000" },
  go: { Glyph: SiGo, from: "#5fd0e8", to: "#00add8" },
  typescript: { Glyph: SiTypescript, from: "#4d8fd1", to: "#3178c6" },
  graphql: { Glyph: SiGraphql, from: "#f06bbd", to: "#e10098" },
  prisma: { Glyph: SiPrisma, from: "#4d5f7a", to: "#2d3748" },
  mysql: { Glyph: SiMysql, from: "#5b8fa8", to: "#4479a1" },
  elastic: { Glyph: SiElasticsearch, from: "#5fbfa0", to: "#005571" },
  mdn: { Glyph: SiMdnwebdocs, from: "#4a4a4a", to: "#000000" },
  stackblitz: { Glyph: SiStackblitz, from: "#2b8fff", to: "#1269d3" },
  replit: { Glyph: SiReplit, from: "#ff9d4a", to: "#f26207" },
  railway: { Glyph: SiRailway, from: "#4a4a5f", to: "#0b0d0e" },
  render: { Glyph: SiRender, from: "#4a5fd9", to: "#000000" },
  sentry: { Glyph: SiSentry, from: "#5d4a8f", to: "#362d59" },
  postman: { Glyph: SiPostman, from: "#ff8f4a", to: "#ff6c37" },
  jenkins: { Glyph: SiJenkins, from: "#e05c5c", to: "#d24939" },
  circleci: { Glyph: SiCircleci, from: "#4a4a4a", to: "#343434" },
  terraform: { Glyph: SiTerraform, from: "#8a5fe8", to: "#7b42bc" },

  // ai
  ollama: { Glyph: SiOllama, from: "#4a4a4a", to: "#000000" },
  elevenlabs: { Glyph: SiElevenlabs, from: "#4a4a4a", to: "#000000" },
  copilot: { Glyph: SiGithubcopilot, from: "#5b5b5b", to: "#1a1a1a" },

  // watching and listening
  hbomax: { Glyph: SiHbo, from: "#8f5fe8", to: "#991eeb" },
  audible: { Glyph: SiAudible, from: "#f5a623", to: "#f8991c" },

  // reading
  theguardian: { Glyph: SiTheguardian, from: "#2b6fd6", to: "#052962" },
  cnn: { Glyph: SiCnn, from: "#e05c5c", to: "#cc0000" },
  techcrunch: { Glyph: SiTechcrunch, from: "#4fd97a", to: "#0a9e4a" },
  arstechnica: { Glyph: SiArstechnica, from: "#ff7a45", to: "#ff4e00" },

  // money
  tradingview: { Glyph: SiTradingview, from: "#3f8fe0", to: "#2962ff" },
  robinhood: { Glyph: SiRobinhood, from: "#7dd93f", to: "#5ac53b" },
  venmo: { Glyph: SiVenmo, from: "#4a9de0", to: "#3d95ce" },
  cashapp: { Glyph: SiCashapp, from: "#2fd07a", to: "#00c244" },

  // learning
  freecodecamp: { Glyph: SiFreecodecamp, from: "#4a4a6a", to: "#0a0a23" },
  codecademy: { Glyph: SiCodecademy, from: "#4a5fd9", to: "#1f4056" },
  pluralsight: { Glyph: SiPluralsight, from: "#f47a5f", to: "#f15b2a" },
  skillshare: { Glyph: SiSkillshare, from: "#4fbfa0", to: "#00ff84" },
  datacamp: { Glyph: SiDatacamp, from: "#4a5fd9", to: "#03ef62" },
  anki: { Glyph: SiAnki, from: "#4a9de0", to: "#2f80ed" },
  zotero: { Glyph: SiZotero, from: "#e05c5c", to: "#cc2936" },

  // play
  ea: { Glyph: SiEa, from: "#4a4a4a", to: "#000000" },
  ubisoft: { Glyph: SiUbisoft, from: "#4a4a4a", to: "#000000" },
  roblox: { Glyph: SiRoblox, from: "#4a4a4a", to: "#000000" },
  chess: { Glyph: SiChessdotcom, from: "#8fbf5f", to: "#81b64c" },
  lichess: { Glyph: SiLichess, from: "#4a4a4a", to: "#000000" },

  // everything else
  baidu: { Glyph: SiBaidu, from: "#3f8fe0", to: "#2319dc" },
  wordpress: { Glyph: SiWordpress, from: "#3f8fa8", to: "#21759b" },
  webflow: { Glyph: SiWebflow, from: "#5b8fff", to: "#146ef5" },
  ghost: { Glyph: SiGhost, from: "#4a4a4a", to: "#15171a" },
  namecheap: { Glyph: SiNamecheap, from: "#ff8c47", to: "#de3723" },
  // Quoted: a key cannot start with a digit unquoted, and brandFor looks it
  // up by string anyway.
  "1password": { Glyph: Si1Password, from: "#4a9de0", to: "#0364d3" },
  bitwarden: { Glyph: SiBitwarden, from: "#4a8fe8", to: "#175ddc" },
  nordvpn: { Glyph: SiNordvpn, from: "#4a8fe8", to: "#4687ff" },
  strava: { Glyph: SiStrava, from: "#ff8c47", to: "#fc4c02" },
  raycast: { Glyph: SiRaycast, from: "#ff7a7a", to: "#ff6363" },
  arc: { Glyph: SiArc, from: "#4a4a4a", to: "#1ab3a6" },
  logseq: { Glyph: SiLogseq, from: "#5fbfa0", to: "#85c8c8" },
};

// Hosts whose brand cannot be read off the address itself. Everything absent
// from here resolves by its own name — github.com is `github`, notion.so is
// `notion` — so only the genuine mismatches are listed: Google's per-service
// subdomains, short share domains, and the few brands whose key differs from
// the domain they answer on.
const HOST_BRANDS = {
  // Sites whose key cannot be read off the address. Added with the brands
  // below: a few answer on a domain that says something else, and a few of the
  // developer ones live on a path of a host we already know.
  "developer.mozilla.org": "mdn",
  "cash.app": "cashapp",
  "max.com": "hbomax",
  "play.hbomax.com": "hbomax",
  "go.dev": "go",
  "golang.org": "go",
  "vuejs.org": "vuejs",
  "nodejs.org": "nodejs",
  "reactjs.org": "react",
  "react.dev": "react",
  "elastic.co": "elastic",
  "chess.com": "chess",
  "ea.com": "ea",
  "arc.net": "arc",
  "ollama.com": "ollama",
  "elevenlabs.io": "elevenlabs",
  "github.com/features/copilot": "copilot",
  "theguardian.com": "theguardian",
  "guardian.co.uk": "theguardian",
  "google.com": "google",
  "mail.google.com": "gmail",
  "drive.google.com": "drive",
  "calendar.google.com": "calendar",
  "docs.google.com": "docs",
  "sheets.google.com": "sheets",
  "slides.google.com": "slides",
  "forms.google.com": "forms",
  "keep.google.com": "keep",
  "tasks.google.com": "tasks",
  "photos.google.com": "photos",
  "maps.google.com": "maps",
  "meet.google.com": "meet",
  "chat.google.com": "chat",
  "messages.google.com": "messages",
  "news.google.com": "news",
  "play.google.com": "play",
  "translate.google.com": "translate",
  "classroom.google.com": "classroom",
  "scholar.google.com": "scholar",
  "colab.google.com": "colab",
  "colab.research.google.com": "colab",
  "gemini.google.com": "gemini",
  "analytics.google.com": "analytics",
  "cloud.google.com": "cloud",
  "fonts.google.com": "fonts",
  "earth.google.com": "earth",
  "lens.google.com": "lens",
  "fit.google.com": "fit",
  "pay.google.com": "pay",
  "home.google.com": "home",
  "myaccount.google.com": "account",
  "accounts.google.com": "account",

  "youtu.be": "youtube",
  "t.me": "telegram",
  "wa.me": "whatsapp",
  "amzn.to": "amazon",
  "dev.to": "devto",
  "ko-fi.com": "kofi",
  "news.ycombinator.com": "ycombinator",
  "chat.openai.com": "chatgpt",
  "music.apple.com": "applemusic",
  "proton.me": "protonmail",
  "twitter.com": "twitter",
};

// Domains that sit one level deeper than a bare TLD, so the brand label is the
// part before them rather than before the last dot: "bbc.co.uk" is bbc, not co.
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "ac", "gov", "edu"]);

export function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// White ink on every icon tile, and a background dark enough to carry it.
//
// A few authentic marks are bright yellow or lime - Drive and Slides at
// #f4b400, Keep at #fbbc04, Snapchat, Buy Me a Coffee, Wise - and a white glyph
// on those is close to invisible. The fix used to be to flip those tiles to
// near-black ink instead. That is right for one tile in isolation and wrong for
// a set: a row of Google apps came out as mostly white marks with three black
// ones punched into it, and the three read as a different kind of thing rather
// than as the same thing in a different colour.
//
// So the ink stays white and the colour gives. Hue and saturation are what makes
// a brand recognisable; its exact lightness is the part nobody could name from
// memory. Both gradient stops are scaled by one factor, which holds the hue and
// saturation exactly - scaling every channel by the same amount leaves the
// ratios between them untouched, where an HSL round trip would drift - until
// white on the darker stop clears 3:1, the WCAG minimum for a graphic, which a
// glyph is.
const WHITE_ON_GRAPHIC = 3;

function channels(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function linear(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// Gamma-corrected, unlike the raw Rec. 709 sum this replaces. That one read
// #f4b400 as bright enough to need dark ink at a 0.62 threshold but gave no way
// to say how much darker it would have to be to take white, because its answer
// was not on the same scale as a contrast ratio.
export function relativeLuminance(hex) {
  const rgb = channels(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function whiteContrast(hex) {
  return 1.05 / (relativeLuminance(hex) + 0.05);
}

function scaled(hex, factor) {
  const rgb = channels(hex);
  return rgb ? toHex(rgb.map((v) => v * factor)) : hex;
}

const gradients = new Map();

// The two stops a tile should actually paint, darkened together if the brand's
// own pair cannot carry a white glyph. Memoised: the search below runs once per
// brand rather than once per icon per render.
export function inkSafeGradient(from, to) {
  const cacheKey = `${from}|${to}`;
  const cached = gradients.get(cacheKey);
  if (cached) return cached;

  // Stepped rather than solved. Luminance runs through the sRGB transfer curve,
  // which has no tidy inverse, and twenty-odd multiplications once per brand is
  // cheaper than an approximation that could land just under the threshold.
  let factor = 1;
  while (factor > 0.2 && whiteContrast(scaled(to, factor)) < WHITE_ON_GRAPHIC) {
    factor -= 0.02;
  }
  const result =
    factor >= 1 ? { from, to } : { from: scaled(from, factor), to: scaled(to, factor) };
  gradients.set(cacheKey, result);
  return result;
}

// Resolve a display name to a brand entry.
export function brandFor(name) {
  const key = String(name || "").toLowerCase().trim();
  if (BRANDS[key]) return BRANDS[key];
  // "Google Drive" -> "drive"
  const stripped = key.replace(/^google\s+/, "");
  if (BRANDS[stripped]) return BRANDS[stripped];
  // A bare host handed in as a name: "github.com" -> "github".
  const host = key.replace(/^www\./, "").split(".")[0];
  if (BRANDS[host]) return BRANDS[host];
  return null;
}

function hostOf(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// The address is a far better signal than the label the user typed above it:
// a link they called "Work" still deserves its real mark, and one called
// "Mail" should not be guessed at. Longest host match wins, so
// mail.google.com is Gmail rather than Google.
export function brandForUrl(url) {
  const host = hostOf(url);
  if (!host) return null;

  const parts = host.split(".");
  for (let i = 0; i < parts.length; i += 1) {
    const named = HOST_BRANDS[parts.slice(i).join(".")];
    if (named && BRANDS[named]) return BRANDS[named];
  }

  // Otherwise the domain's own label: "en.wikipedia.org" -> wikipedia.
  if (parts.length < 2) return BRANDS[parts[0]] || null;
  const tail = parts[parts.length - 1];
  const deep = parts.length >= 3 && tail.length === 2 && SECOND_LEVEL.has(parts[parts.length - 2]);
  return BRANDS[parts[parts.length - (deep ? 3 : 2)]] || null;
}

// What a quick link should wear. The address decides it where we know the
// site, the user's own label is the second opinion, and a monogram on a hue
// hashed from the name is what is left — always something, never a borrowed
// mark and never an empty square.
export function brandForLink(url, name) {
  return brandForUrl(url) || brandFor(name);
}
