# Strangr

A real-time anonymous chat platform built with Next.js, Socket.IO, and Neon Postgres. Connect with random strangers instantly — no sign-up required.

## Features

- **Random Matching** — Get paired with a stranger in seconds
- **Interest Tags** — Add interests to match with like-minded people
- **Real-time Messaging** — Instant text chat via WebSocket
- **View-Once Media** — Send photos, GIFs, and videos that disappear after viewing
- **Auto-Close Timer** — Set how long images/GIFs can be viewed (3s–30s)
- **Typing Indicator** — See when the other person is typing
- **Country Detection** — See your partner's country flag
- **Tab Away Detection** — Get notified when partner switches tabs
- **ESC Shortcuts** — ESC to disconnect, ESC again for new chat
- **Screenshot Protection** — Canvas rendering, keyboard interception, blur-on-focus-loss
- **Anonymous** — No accounts, no data stored, IP hashed for ban enforcement only

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| UI Components | shadcn/ui, Framer Motion, Lucide Icons |
| Real-time | Socket.IO (WebSocket server) |
| Database | Neon Serverless Postgres, Drizzle ORM |
| Testing | Playwright |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) database (free tier works)

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd project_01

# Install dependencies
npm install

# Copy env file and add your Neon database URL
cp .env.example .env
```

Add your `DATABASE_URL` to `.env`:

```
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
```

### Push Database Schema

```bash
npm run db:push
```

### Run Development

You need two terminals:

```bash
# Terminal 1 — Next.js frontend
npm run dev

# Terminal 2 — Socket.IO server
npm run server
```

Open `http://localhost:3000` in your browser.

### Test with Two Users

Open two browser tabs at `http://localhost:3000/chat`. Click "START CHATTING" in both — they'll match and you can chat between them.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run server` | Start Socket.IO server (port 3001) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Playwright tests |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
├── server/                 # Socket.IO server (matching + messaging)
│   └── index.ts
├── src/
│   ├── app/
│   │   ├── page.tsx        # Landing page
│   │   └── chat/page.tsx   # Chat page (controller)
│   ├── components/
│   │   ├── chat/           # Chat UI (9 components)
│   │   ├── landing/        # Landing page (6 components)
│   │   └── ui/             # shadcn base components
│   └── db/
│       ├── index.ts        # Database connection
│       └── schema/         # Drizzle schema (6 tables)
├── tests/                  # Playwright E2E tests
├── .kiro/steering/         # AI agent steering files
└── playwright.config.ts
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Anonymous users (socket_id, ip_hash, interests, ban status) |
| `chat_sessions` | Text/video session records |
| `messages` | Chat messages within sessions |
| `reports` | User reports for moderation |
| `blocked_users` | Block list with composite unique constraint |
| `interests` | Available interest tags with usage counts |

## Architecture

```
Browser A ←→ Socket.IO Server (port 3001) ←→ Browser B
                    ↑
             Matching Queue
             Active Sessions Map
             Country Registry
```

The Socket.IO server handles:
- User queue management and random matching
- Interest-based priority matching
- Message relay between paired users
- Typing indicators
- Media relay (base64, never stored)
- Visibility/away status
- Disconnect notifications

## License

MIT
