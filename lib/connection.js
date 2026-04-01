import config from "../config.js";
import fs from "fs";
import path from "path";
import chalk from "chalk";

import makeWASocket, {
  useMultiFileAuthState,
  getContentType,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "baileys";

import EventEmitter from "events";

const eventBus = new EventEmitter();
const store = {
  contacts: {},
};

global.statusConnected = global.statusConnected || {};

function setStatusConnected(id, status) {
  global.statusConnected = global.statusConnected || {};
  global.statusConnected[id] = !!status; // ensure only true/false
}
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";
const logger = pino({ level: "silent" });

import { updateSocket } from "./scheduled.js";
import { sessions } from "./cache.js";
import serializeMessage from "./serializeMessage.js";
import { updateJadibot, getJadibot } from "./jadibot.js";

import { processMessage, participantUpdate } from "../autoresbot.js";

import {
  createBackup,
  getnumberbot,
  logWithTime,
  setupSessionDirectory,
  isQuotedMessage,
  removeSpace,
  restaring,
  success,
  danger,
  sleep,
  sendMessageWithMentionNotQuoted,
  validations,
  extractNumbers,
  deleteFolderRecursive,
  getSenderType,
} from "./utils.js";


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let qrCount = 0;
let error403Timestamps = [];

async function getTimeStamp() {
  const now = new Date();
  const options = { timeZone: "Asia/Jakarta", hour12: false };
  const timeString = now.toLocaleTimeString("en-US", options);

  return `[${timeString}]`;
}

async function getLogFileName() {
  const now = new Date();
  const folder = path.join(process.cwd(), "logs_panel");

  // Create folder if it doesn't exist
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  // File name format: YYYY-MM-DD_HH-MM.log
  return path.join(
    folder,
    `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-` +
      `${now.getDate().toString().padStart(2, "0")}______` +
      `${now.getHours().toString().padStart(2, "0")}-` +
      `${now.getMinutes().toString().padStart(2, "0")}.log`
  );
}

async function debugLog(msg) {
  // Ensure input is an object to avoid errors
  if (typeof msg !== "object" || msg === null) {
    console.error("debugLog only accepts objects.");
    return;
  }

  const logEntry = `${await getTimeStamp()} DEBUGGING\n${JSON.stringify(
    msg,
    null,
    2
  )}\n----------------- || ------------------\n`;
  const logFile = await getLogFileName();

  try {
    // Write to log file asynchronously (non-blocking)
    await fs.promises.appendFile(logFile, logEntry);
  } catch (error) {
    console.error(`Failed to write log: ${error.message}`);
  }
}

async function connectToWhatsApp(folder = "session") {
  let phone_number_bot = "";
  const numbersString = extractNumbers(folder);

  const dataSession = await getJadibot(numbersString);
  if (dataSession) {
    phone_number_bot = numbersString;
    if (dataSession.status == "stop" || dataSession.status == "logout") {
      return;
    }
  }

  for (const { key, validValues, validate, errorMessage } of validations) {
    const value = config[key]?.toLowerCase();
    if (validValues && !validValues.includes(value)) {
      return danger("Error config.js", errorMessage);
    }
    if (validate && !validate(config[key])) {
      return danger("Error config.js", errorMessage);
    }
  }

  const sessionDir = path.join(process.cwd(), folder);

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: logger,
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    // syncFullHistory: false,  // Disable chat history sync
    // syncChats: false,  // Disable automatic chat sync
    // emitOwnEvents: false,  // Avoid processing own events
    // markOnlineOnConnect: false,  // Avoid updating online status on each connect
    // downloadHistory: false,  // Avoid automatic chat history download
  });

  // Save session to Map
  sessions.set(folder, sock);

  if (
    !sock.authState.creds.registered &&
    config.type_connection.toLowerCase() == "pairing"
  ) {
    if (folder != "session") {
      // jadibot
      logWithTime("Jadibot", `Connection "${folder}" disconnected`, "merah");
      return false;
    }
    const phoneNumber = config.phone_number_bot;
    await delay(4000);
    const code = await sock.requestPairingCode(phoneNumber.trim());

    // Format pairing code: split into 1234-5678
    const formattedCode = code.slice(0, 4) + "-" + code.slice(4);

    console.log(chalk.blue("PHONE NUMBER: "), chalk.yellow(phoneNumber));
    console.log(chalk.blue("CODE PAIRING: "), chalk.yellow(formattedCode));
  }

  sock.ev.on("creds.update", saveCreds);

  try {
    setupSessionDirectory(sessionDir);
  } catch {}

  sock.ev.on("contacts.update", (contacts) => {
    contacts.forEach((contact) => {
      store.contacts[contact.id] = contact;
    });
  });

  sock.ev.on("messages.upsert", async (m) => {
    // INCOMING CHAT

    try {
      eventBus.emit("contactsUpdated", store.contacts);
      // Incoming message handling moved to /lib/serializeMessage.js
      const result = serializeMessage(m, sock);
      if (!result) {
        return;
      }

      const { id, message, remoteJid, command } = result;
      const key = message.key;

      /* --------------------- Send Message ---------------------- */
      try {
        if (config.autoread) {
          await sock.readMessages([key]);
        }
        const validPresenceUpdates = [
          "unavailable",
          "available",
          "composing",
          "recording",
          "paused",
        ];
        if (validPresenceUpdates.includes(config?.PresenceUpdate)) {
          await sock.sendPresenceUpdate(config.PresenceUpdate, remoteJid);
        } else {
          //logWithTime('System', `PresenceUpdate Invalid: ${config?.PresenceUpdate}`);
        }
        await processMessage(sock, result);
      } catch (error) {
        console.log(`Error occurred while processing message: ${error}`);
      }
    } catch (error) {
      console.log(
        chalk.redBright(`Error in message upsert: ${error.message}`)
      );
    }
  });

  sock.ev.on("group-participants.update", async (m) => {
    // GROUP PARTICIPANT CHANGES

    if (!m || !m.id || !m.participants || !m.action) {
      logWithTime("System", `Invalid participant data`);
      return;
    }
    const messageInfo = {
      id: m.id,
      participants: m.participants,
      action: m.action,
      store,
    };

    try {
      await participantUpdate(sock, messageInfo);
    } catch (error) {
      console.log(
        chalk.redBright(`Error in participant Update: ${error}`)
      );
    }
  });

  sock.ev.on("call", async (calls) => {
    // Someone is calling/video calling in private chat
    if (!config.anticall) return; // if false
    for (let call of calls) {
      if (!call.isGroup && call.status === "offer") {
        const callType = call.isVideo ? "VIDEO" : "VOICE";
        const userTag = `@${call.from.split("@")[0]}`;
        const statusJid = getSenderType(call.from);
        const messageText = `⚠️ _THE BOT CANNOT RECEIVE ${callType} CALLS._\n
_SORRY ${userTag}, YOU WILL BE *BLOCKED*._
_Please Contact the Owner to Unblock!_
_Website: autoresbot.com/contact_`;

        logWithTime("System", `Call from ${call.from}`);

        await sendMessageWithMentionNotQuoted(
          sock,
          call.from,
          messageText,
          statusJid
        );
        await sleep(2000);
        await sock.updateBlockStatus(call.from, "block");
      }
    }
  });

  sock.ev.on("connection.update", async (update) => {
    // CONNECTION CHANGE

    if (sock && sock.user && sock.user.id) {
      global.phone_number_bot = getnumberbot(sock.user.id);
    }

    const { connection, lastDisconnect, qr } = update;
    if (qr != null && config.type_connection.toLowerCase() == "qr") {
      if (folder != "session") {
        // jadibot
        logWithTime("Jadibot", `Connection "${folder}" disconnected`, "merah");
        return false;
      }
      qrCount++; // Increment by 1 every time QR is displayed
      logWithTime("System", `Displaying QR`);
      qrcode.generate(qr, { small: true }, (qrcodeStr) => {
        console.log(qrcodeStr);
      });
      success(
        "QR",
        `Please scan through the WhatsApp app!. (Try ${qrCount}/5)`
      );

      if (qrCount >= 5) {
        danger(
          "Timeout",
          "Too many QR displays, please try again"
        );
        process.exit(0); // Stop process
      }
    }

    if (connection === "close") {
      setStatusConnected(config.phone_number_bot, false);
      await updateSocket(sock); // Update sock scheduled

      sessions.delete(folder);

      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      switch (reason) {
        case DisconnectReason.badSession:
          console.log(chalk.redBright(`Bad Session File, Start Again ...`));
          logWithTime("System", `Bad Session File, Start Again ...`);
          return await connectToWhatsApp(folder);
          break;

        case DisconnectReason.connectionClosed:
          console.log(chalk.redBright(`Connection closed, reconnecting....`));
          logWithTime("System", `Connection closed, reconnecting....`);
          return await connectToWhatsApp(folder);
          break;

        case DisconnectReason.connectionLost:
          console.log(
            chalk.redBright(`Connection Lost from Server, reconnecting...`)
          );
          logWithTime("System", `Connection Lost from Server, reconnecting...`);
          return await connectToWhatsApp(folder);
          break;

        case DisconnectReason.connectionReplaced:
          console.log(
            chalk.redBright(
              `Connection Replaced, Another New Session Opened, Please Restart Bot`
            )
          );
          logWithTime(
            "System",
            `Connection Replaced, Another New Session Opened, Please Restart Bot`
          );
          if (sock) {
            // If connection instance exists
            await sock.logout(); // Remove authentication and disconnect
          }
          await delay(4000);
          return await connectToWhatsApp(folder);
          break;

        case DisconnectReason.loggedOut:
          console.log(
            chalk.redBright(
              `Device Logged Out, Delete Session Folder and Perform Scan/Pairing Again`
            )
          );
          logWithTime(
            "System",
            `Device Logged Out, Delete Session Folder and Perform Scan/Pairing Again`
          );

          if (folder != "session" && phone_number_bot) {
            // jadibot

            await updateJadibot(phone_number_bot, "logout");

            if (folder != "session") {
              // jadibot
              deleteFolderRecursive(folder);
            }

            // Remove active session
            const sockSesi = sessions.get(folder);
            if (sockSesi) {
              await sockSesi.ws.close(); // Close WebSocket
            }
            return;
          }
          break;

        case DisconnectReason.restartRequired:
          logWithTime("System", `Restart Required, Restarting..`);
          return await connectToWhatsApp(folder);
          break;

        case DisconnectReason.timedOut:
          console.log(chalk.redBright(`Connection TimedOut, Reconnecting...`));
          logWithTime("System", `Connection TimedOut, Reconnecting...`);
          return await connectToWhatsApp(folder);
          break;

        default:
          console.log(
            chalk.redBright(`Unknown DisconnectReason: ${reason}|${connection}`)
          );
          logWithTime(
            "System",
            `Unknown DisconnectReason: ${reason}|${connection}`
          );
          if (folder != "session" && phone_number_bot) {
            // jadibot

            await updateJadibot(phone_number_bot, "baned");
          }
          const now = Date.now();

          // If error 403
          if (reason === 403) {
            // Save current timestamp
            error403Timestamps.push(now);

            // Filter: only timestamps within the last 60 seconds
            error403Timestamps = error403Timestamps.filter(
              (ts) => now - ts < 60000
            );

            // If more than 3 in 1 minute
            if (error403Timestamps.length > 3) {
              console.log(
                chalk.bgRed(
                  "[BLOCKED] Too many 403 errors within 1 minute. Stopping reconnect temporarily."
                )
              );
              return; // Do not reconnect
            }

            console.log(
              chalk.yellow("⚠️ Error 403 occurred. Attempting to reconnect...")
            );
            await connectToWhatsApp(folder); // Continue reconnect
            return;
          }

          return await connectToWhatsApp(folder);
          break;
      }
    } else if (connection === "open") {
      setStatusConnected(config.phone_number_bot, true);

      const isSession = folder === "session";
      success(isSession ? "System" : "Jadibot", "Connection Established");

      if (!isSession && phone_number_bot) {
        await updateJadibot(phone_number_bot, "active");
      }

      const isRestart = await restaring();
      if (isRestart) {
        if (isSession) {
          await sock.sendMessage(isRestart, {
            text: "_Bot successfully restarted_",
          });
        }
      } else if (isSession) {
        await sock.sendMessage(`${config.phone_number_bot}@s.whatsapp.net`, {
          text: "_Bot Connected_",
        });
      }

      try {
        await updateSocket(sock); // Update sock scheduled
      } catch (error) {
        console.log(
          chalk.redBright(
            `Error running updateSocket or waktuSholat: ${error.message}`
          )
        );
      }

      try {
        if (config.autobackup && folder == "session") {
          const backupFilePath = await createBackup();
          const filename = "autoresbot backup.zip";
          const documentPath = backupFilePath.path;

          await sock.sendMessage(`${config.owner_number[0]}@s.whatsapp.net`, {
            document: { url: documentPath },
            fileName: filename,
            mimetype: "application/zip",
          });

          // Log backup success
          logWithTime("System", `Backup successful: ${backupFilePath}`);
        }
      } catch (error) {
        // Handle error with log information
        console.error("Error occurred during backup process:", error.message);
      }
    }
  });

  return sock;
}

export { connectToWhatsApp };
