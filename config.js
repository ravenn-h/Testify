import moment from "moment-timezone";

const CONNECTION = "pairing"; // qr or pairing
const OWNER_NAME = "𝑻𝑬𝑺𝑻𝑰𝑭𝒀";
const NOMOR_BOT = "22789915298"; // 628xx wa number
const DESTINATION = "both"; // group , private, both
const APIKEY = "19cf3ba8c7a0b6923de2c8f7"; // apikey from autoresbot.com (apikey package)
const RATE_LIMIT = 3000; // 3 seconds/chat
const SIMILARITY = true; // Similar command search (true, false)
const MODE = "production"; // [production, development] (do not change unless you are a developer)
const VERSION = global.version; // don't edit

const EMAIL = "@gmail.com";
const REGION = "Ivory Coast";
const WEBSITE = "";
const DATA_OWNER = ["2250104610403"];

// Chat Configuration
const ANTI_CALL = true; // if true (anyone who calls privately will be blocked)
const AUTO_READ = false; // if true (every chat will be read/double blue tick)
const AUTO_BACKUP = false; // if true (every server restart, backup data is sent to owner wa)
const MIDNIGHT_RESTART = true; // Restart every midnight
const PRESENCE_UPDATE = ""; // unavailable, available, composing, recording, paused
const TYPE_WELCOME = "2"; // 1, 2, 3, 4, 5, 6 text and random
const BG_WELCOME2 = "https://api.autoresbot.com/api/maker/bg-default";

// anti-badword in group
const BADWORD_WARNING = 3; // Maximum number of warnings before action is taken
const BADWORD_ACTION = "both"; // action after warnings are met (kick, block, both)

// anti-spam in group
const SPAM_LIMIT = 3; // Message threshold considered spam
const SPAM_COULDOWN = 10; // Cooldown time in seconds (10 seconds)
const SPAM_WARNING = 3; // Maximum number of warnings before action is taken
const SPAM_ACTION = "both"; // action after warnings are met (kick, block, both)

// More
const STATUS_SCHEDULED = true;

const config = {
  APIKEY,
  phone_number_bot: NOMOR_BOT,
  type_connection: CONNECTION,
  bot_destination: DESTINATION,
  owner_name: OWNER_NAME,
  owner_number: DATA_OWNER,
  owner_website: WEBSITE,
  owner_email: EMAIL,
  region: REGION,
  version: VERSION,
  rate_limit: RATE_LIMIT,
  status_prefix: true, // must use prefix : or false without prefix
  prefix: [".", "!", "#"],
  sticker_packname: OWNER_NAME,
  sticker_author: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n
  Ravenn Multidevice\n\nKrevlin Store - 2250104610403\n\n
  ${moment.tz("Africa/Abidjan").format("DD/MM/YY")}`,
  mode: MODE,
  commandSimilarity: SIMILARITY,
  anticall: ANTI_CALL,
  autoread: AUTO_READ,
  autobackup: AUTO_BACKUP,
  PresenceUpdate: PRESENCE_UPDATE,
  typewelcome: TYPE_WELCOME,
  bgwelcome2: BG_WELCOME2,
  midnight_restart: MIDNIGHT_RESTART,
  scheduled: STATUS_SCHEDULED,
  SPAM: {
    limit: SPAM_LIMIT,
    couldown: SPAM_COULDOWN,
    warning: SPAM_WARNING,
    action: SPAM_ACTION,
  },
  BADWORD: {
    warning: BADWORD_WARNING,
    action: BADWORD_ACTION,
  },
};

export default config;
