# C9 StratOS – AI Engineering Guide

This repository is an AI-assisted (Jetbrains Junie) engineering project that uses Next.js 15, MongoDB, and Codex automation to build a Valorant analytics and assistant coaching platform.

## Purpose of the project

C9 StratOS is designed for pro-level Valorant coaching.  
It ingests match data, computes analytics, and generates AI-driven coaching insights for the Cloud9 Valorant team.

## Technology overview

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** MongoDB Atlas via Mongoose
- **AI:** LLM-based coaching endpoint (Next.js route)
- **ML (optional):** Python-based clustering or round probability model
- **Frontend:** Tailwind, clean dashboards

## Core directories

- `app/`  
  Next.js pages and layouts, server components, API routes.

- `models/`  
  Mongoose models (`Team`, `Match`, upcoming `Player` and `Round`).

- `lib/`  
  Shared utilities, database connector, analytics computations, auth helpers.

- `lib/analytics/`  
  All team and match analytics functions.

- `lib/auth.ts`  
  Cookie-based authentication.

## Coding conventions

- Use TypeScript for all modules.
- Use server components for pages unless interactivity is required.
- Keep analytics in dedicated functions, not inside API routes.
- Maintain consistent naming: camelCase for functions, PascalCase for models.
- Avoid unnecessary abstractions until needed.

## AI expectations for Codex

When modifying or creating files:

1. Follow existing project structure.
2. Avoid rewriting entire files unless necessary.
3. Keep analytics logic pure and deterministic.
4. Never introduce unused dependencies.
5. When generating AI-related code:
    - Separate prompt templates into their own files.
    - Keep LLM calls inside `app/api/coach-report/route.ts`.
6. For ML additions:
    - Place Python code inside `/ml-service/`
    - Provide an endpoint `/api/ml/*` for Next.js to call.

## Future planned modules

- `computeMatchAnalytics.ts`
- `computePlayerStats.ts`
- `computeEconomyStats.ts`
- `app/matches/[matchId]/page.tsx`
- AI coaching prompt templates
- Scouting report generator (Category 2 submission)

This file serves as Codex guidance for maintaining consistent architecture as the project scales.
