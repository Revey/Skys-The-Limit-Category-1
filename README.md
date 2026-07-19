# StratOS

AI-powered Valorant analytics and assistant coaching for professional teams. Built with Next.js 15 App Router, TypeScript, Tailwind CSS, and MongoDB via Mongoose.

Setup
- Prereqs: Node.js 18+, npm, MongoDB Atlas URI
- Install deps: npm install
- Env: copy .env.example to .env.local and set MONGODB_URI
- Dev: npm run dev (http://localhost:3000)

Auth
- Hardcoded in config/auth.ts (username: coach, password: stratos)
- POST /api/auth sets HTTP-only cookie; /dashboard and /matches/[matchId] require it

Key structure
- app/
  - layout.tsx, page.tsx, login/page.tsx, dashboard/page.tsx, matches/[matchId]/page.tsx
  - api/health, api/auth, api/coach/match, api/matches, api/refresh-stats
- lib/db.ts, lib/auth.ts, lib/analytics/*
- models/Team.ts, models/Match.ts
- tailwind.config.ts, postcss.config.js, app/globals.css

Environment
- .env.local: MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/c9-stratos

Scripts
- npm run dev — start dev server
- npm run build — build
- npm run start — start production server
- npm run lint — ESLint
- npm run typecheck — TypeScript
