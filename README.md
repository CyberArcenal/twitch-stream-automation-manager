# Twitch Stream Manager – All-in-One Desktop Tool for Streamers

A powerful Electron‑based desktop application that helps Twitch streamers manage their channel with automation, moderation, analytics, and much more – all from a single, modern interface.

<!-- ![Screenshot Placeholder](https://via.placeholder.com/800x400?text=Twitch+Stream+Manager) -->

## ✨ Features

### 🤖 Automation
- **Auto‑Raid** – automatically raid a target channel when your stream ends.
- **Auto‑Clip** – create a clip when the stream goes offline.
- **Auto‑Message** – send a custom chat message when someone follows or subscribes.
- **Auto‑Shoutout on Raid** – thank raiders with a customizable message.
- **Auto‑Slow Mode** – enable slow mode when a user exceeds a message per minute threshold (spam protection).
- **Auto‑Follower Mode** – enable follower‑only chat during a raid (configurable duration).
- **Auto‑Clip on Chat Spike** – create a clip when chat activity suddenly increases (configurable threshold & cooldown).
- **Auto‑Stream Markers** – automatically add stream markers at configurable intervals while live.
- **Custom Chat Commands** – create your own commands with custom text replies (e.g. `!discord`, `!socials`).

### 🛡️ Auto‑Moderation
- **Blocked words** – timeout and/or delete messages containing forbidden terms.
- **Blocked links** – automatically handle messages with URLs.
- **Excessive caps** – detect and punish all‑caps messages (supports non‑Latin scripts).
- **Excessive emojis** – limit emoji spam.
- **Repeated messages (spam)** – timeout users who send the same message multiple times in a short window.
- **Blocked badges** – automatically timeout users with specific badges (e.g., `troll`, `known_spammer`).
- **Trusted users** – exempt certain users from moderation.
- **Separate master toggle** – enable/disable all auto‑moderation at once.

### 💬 Chat Management
- **Full chat integration** – view, send, and moderate chat directly from the app.
- **Chat history** – save and search past messages (up to 7 days retention).
- **Pinned messages** – keep important messages visible.
- **Reply, mention, delete, timeout, ban** – full moderation toolbox.
- **Whisper support** – send and receive private messages.

### 📊 Analytics & Goals
- **Automatic snapshot collection** – follower count, viewer count, top clips every X minutes.
- **Follower & viewer history charts** – visualize growth over time.
- **Stream goals** – set and track goals (followers, subscribers, bits, views) with real‑time updates via EventSub.

### ⏰ Scheduler
- Schedule **stream title/game updates** at specific times (daily or every X minutes/hours).
- Schedule **commercial breaks** (Twim integration).
- All schedules persist across app restarts.

### 🎛️ Other Integrations
- **OBS WebSocket** – control scenes, start/stop streaming, monitor stream health.
- **Picture‑in‑Picture** – pop out the Twitch player into a floating window.
- **Ad blocker detection** – (basic) notify when an ad is playing.
- **Themes** – light/dark mode support.

### 🔧 Customisation
- **Custom chat filters** – hide messages containing certain words from the UI.
- **Custom shortcuts** – remap keyboard shortcuts for player controls, commercial trigger, etc.
- **Custom scripts** – upload and enable your own scripts (experimental).

## 🛠️ Tech Stack

- **Electron** – cross‑platform desktop runtime.
- **React** – UI components.
- **TypeScript** – type‑safe front‑end.
- **Tailwind CSS** – styling (with CSS variables for theming).
- **@twurple** – Twitch API and chat client.
- **Electron Store** – persistent local storage.

## 📦 Installation

### Prerequisites
- Node.js v18 or later
- npm or yarn

### Clone the repository
```bash
git clone https://github.com/CyberArcenal/twitch-stream-automation-manager.git
cd twitch-stream-automation-manager
```

### Install dependencies
```bash
npm install
```

### Set up your Twitch Application
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Create a new application:
   - Name: `Twitch Stream Manager`
   - OAuth Redirect URLs: `http://localhost:3000` (or your custom redirect)
   - Category: `Application Integration`
3. Copy the **Client ID** and **Client Secret**.
4. Create a `.env` file in the project root (or edit `src/shared/config.js` directly):
```env
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_REDIRECT_URI=http://localhost:3000
```

### Run in development mode
```bash
npm run dev
```

### Build for production
```bash
npm run build
```
The packaged app will be available in the `dist` folder.

## 🚀 Usage Overview

1. **First launch** – click “Login with Twitch” and authorise the required scopes:
   - `chat:read`, `chat:edit`
   - `channel:manage:broadcast`
   - `moderator:manage:ban_messages`
   - `user:read:email`, `user:read:follows`
   - (and more depending on features used)

2. **Main dashboard** – view live stream status, chat, and quick actions.

3. **Automation panel** – configure and start the automation engine:
   - Stream triggers (raid, clip, message on follow/sub)
   - Chat automation (slow mode, follower mode, blocked terms, shoutouts)
   - Custom scripts

4. **Auto‑moderation settings** – tune rules (blocked words, caps, emojis, repeated messages, blocked badges).

5. **Goals** – add and track progress; numbers update in real time from Twitch events.

6. **Scheduler** – plan title/game changes or commercials.

7. **Chat commands** – manage built‑in commands (`!so`, `!clip`, `!uptime`, `!lurk`) and create your own.

## 🔧 Development

### Project structure (simplified)
```
src/
├── main/                 # Electron main process
│   ├── services/         # All backend services (automation, chat, Twitch API, etc.)
│   └── ipc/              # IPC handlers
├── renderer/             # React front‑end
│   ├── pages/            # Main views (Stream Manager, Analytics, Scheduler, etc.)
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (theme, logs, etc.)
│   ├── api/              # API client layer (calls to main process)
│   └── hooks/            # Custom React hooks
└── shared/               # Shared constants, config
```

### Main scripts
- `npm run dev` – start Electron with hot reload.
- `npm run build` – compile TypeScript and package Electron app.
- `npm run lint` – run ESLint.

### Adding a new feature
1. Implement backend service in `src/main/services/`.
2. Expose API via IPC handler in `src/main/ipc/`.
3. Add API client in `src/renderer/api/core/`.
4. Build UI components and connect using the API.

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0 – see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Twitch API](https://dev.twitch.tv/docs/api/)
- [@twurple](https://twurple.js.org/) – amazing Twitch library
- [Electron](https://www.electronjs.org/)
- [Lucide Icons](https://lucide.dev/)

---

**Happy streaming!** 🎮✨