# Planner Backend — Developer Guide

## Quick Start

```bash
cd ~/planner/backend-ts
npm install
npx prisma generate
npx prisma db push     # creates/updates SQLite dev.db
npm run dev            # starts tsx watch on port 4000
```

## Prisma Schema Changes

1. Edit `prisma/schema.prisma` — all models use `@@map("snake_case_table_names")`
2. Run `npx prisma generate` — updates Prisma Client types
3. Run `npx prisma db push` — syncs SQLite schema (safe for dev, drops are data-loss)

## Auth System

- Token-based auth (no JWTs). Login/register return a UUID token key.
- Send `Authorization: Bearer <token>` or `Authorization: Token <token>` header.
- Auth middleware: `auth.ts` — `authMiddleware` requires token, `optionalAuth` doesn't.
- Admin routes check `req.user.developer` flag — set via DB or profile update endpoint.

## Route Patterns

All routes follow RESTful patterns with consistent error shapes:

```json
{ "error": "Descriptive error message" }
```

Every authenticated route returns `401 { "error": "Authentication required" }` when missing token.

## Key Implementation Details

- **Working hours**: Uses `/check-in` and `/check-out` POST routes (no root POST handler)
- **Files**: Uploads via POST `/api/files/upload` with multipart/form-data
- **Google Sheets**: Config at `/api/google-sheets/config`, sync at `/api/google-sheets/sync`
- **Calendar events**: Include comments relation on GET
- **Admin**: Requires `developer=true` or `teamRole='admin'` on the user record
- **Tasks**: Require `userId` (assignee) and `text` (description) in POST body

## Health Check

```
GET http://localhost:4000/api/health
→ { "status": "ok", "timestamp": "2026-07-05T..." }
```
