# TESTIFY WhatsApp Bot

## Overview
A powerful WhatsApp bot script (v2.0.1) built by Autoresbot using the `baileys` library. Features a modular plugin-based architecture for managing commands, games, downloads, AI interactions, and group administration.

## Technology Stack
- **Runtime:** Node.js 20.x (required)
- **Package Manager:** npm
- **Core Library:** baileys (WhatsApp Web API)
- **Module System:** ES Modules (`"type": "module"`)

## Project Structure
- `index.js` - Entry point; validates Node version and starts the app
- `config.js` - Central configuration (API keys, bot number, prefix, toggles)
- `lib/` - Core logic: connection, message serialization, plugin management, startup
- `plugins/` - Plugin commands grouped by category (ADMIN, AI, DOWNLOAD, GAMES, MAKER, OWNER, TOOLS)
- `database/` - Persistent and temporary data storage (JSON files)
- `handle/` - Event handlers (AFK, badwords, first-chat)
- `session/` - WhatsApp authentication session data

## Running the Bot
```bash
npm start
```

The bot connects to WhatsApp via QR code or pairing code (displayed in the console). Configure `config.js` with your bot's phone number and API key before first run.

## Workflow
- **Start application** - Runs `npm start` (console output)

## System Dependencies
- ffmpeg, cairo, pango, libjpeg, giflib, librsvg, pkg-config, python3

## Key Configuration (config.js)
- `phone_number_bot` - Bot's WhatsApp number
- `owner_number` - Owner's WhatsApp number  
- `prefix` - Command prefix character
- API key for `api-autoresbot` service
