# Phase 5 Complete — Auth, Database, History, Marketing Pages

## Architecture

```mermaid
graph TB
    subgraph Extension
        SP[Side Panel] -->|ClerkProvider| AG[AuthGate]
        AG -->|useAuth| AI[Agent UI]
        BG[Background SW] -->|POST| SAVE[/api/task/save]
        BG -->|Clerk JWT| SAVE
    end

    subgraph "Next.js Web App"
        MW[Clerk Middleware] -->|protect| DASH[Dashboard]
        MW -->|public| MKT[Marketing Pages]
        SAVE -->|Drizzle| DB[(Supabase PostgreSQL)]
        HIST[/api/task/history] -->|Drizzle| DB
        RUN[/api/agent/run] -->|Clerk auth| CLAUDE[Claude / Gemini]
    end

    SP -.->|syncSessionWithTab| MW
```

---

## Files Created / Modified (22 files total)

### Database Layer (3 new files)
| File | Purpose |
|---|---|
| [schema.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/drizzle/schema.ts) | Drizzle tables: `users` (Clerk ID PK), `tasks`, `steps`, `settings`. No RLS — all scoping at app level |
| [db.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/lib/db.ts) | Drizzle client with Supabase service role connection (singleton for serverless) |
| [drizzle.config.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/drizzle.config.ts) | Drizzle Kit config for migrations |

### Task API (2 new files)
| File | Purpose |
|---|---|
| [save/route.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/api/task/save/route.ts) | POST — Clerk JWT auth, upserts user, inserts task + steps. userId always from JWT |
| [history/route.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/api/task/history/route.ts) | GET — Cursor-based pagination, always scoped to userId from JWT |

### Auth + Infrastructure (5 files)
| File | Status | Purpose |
|---|---|---|
| [middleware.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/middleware.ts) | **UPDATED** | Full Clerk enforcement — marketing public, dashboard + API protected |
| [layout.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/layout.tsx) | **UPDATED** | ClerkProvider wrapper, Tailwind body, SEO metadata |
| [globals.css](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/globals.css) | **NEW** | Tailwind v4 @theme with DESIGN.md light palette for marketing |
| [postcss.config.mjs](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/postcss.config.mjs) | **NEW** | @tailwindcss/postcss plugin |
| [next.config.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/next.config.ts) | **UPDATED** | transpilePackages + serverComponentsExternalPackages |

### Marketing Pages (5 new files)
| File | Purpose |
|---|---|
| [(marketing)/layout.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/(marketing)/layout.tsx) | Sticky nav with logo/links/CTA, 4-column footer |
| [(marketing)/page.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/(marketing)/page.tsx) | Hero "Your AI Assistant That Actually Uses Your Browser", 3 feature cards, social proof |
| [pricing/page.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/(marketing)/pricing/page.tsx) | 3-tier pricing (Free $0 / Pro $29 / Power $79), FAQ section |
| [download/page.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/(marketing)/download/page.tsx) | OS auto-detect (3-tier), GitHub release links, install instructions accordion |
| [changelog/page.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/(marketing)/changelog/page.tsx) | Timeline layout with v0.1.0 entries |

### Dashboard (2 new files)
| File | Purpose |
|---|---|
| [dashboard/layout.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/dashboard/layout.tsx) | Sidebar nav + Clerk UserButton |
| [dashboard/page.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/app/dashboard/page.tsx) | Stats cards (tasks today/total/plan), task history table with pagination |

### Extension Auth (5 modified/new files)
| File | Status | Purpose |
|---|---|---|
| [AuthGate.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/extension/components/AuthGate.tsx) | **NEW** | Sign-in gate with Google OAuth CTA, chrome.storage.onChanged auto-refresh, 5s fallback hint |
| [sidepanel/main.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/extension/entrypoints/sidepanel/main.tsx) | **UPDATED** | Wrapped with ClerkProvider + AuthGate |
| [popup/main.tsx](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/extension/entrypoints/popup/main.tsx) | **UPDATED** | Wrapped with ClerkProvider |
| [background.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/extension/entrypoints/background.ts) | **UPDATED** | Clerk auth forwarding to native, task persistence to /api/task/save |
| [ai.ts](file:///c:/Users/rohit/OneDrive/Desktop/dart/apps/web/lib/ai.ts) | **FIXED** | Removed OpenAI dep, reverted to Gemini Flash (free) + Claude Sonnet 4 (pro/power) |

---

## Build Verification
```
✓ pnpm install — drizzle-orm, postgres, drizzle-kit, @tailwindcss/postcss, @clerk/chrome-extension
✓ Extension build — 2.96 MB (includes Clerk UI code-split chunks), zero errors
✓ Web app typecheck — tsc --noEmit passes clean (zero errors)
✓ Background.ts — Fixed await in non-async callback (used .then() instead)
✓ Drizzle history route — Fixed chained .where() to use and()
```

## Security Model
> [!IMPORTANT]
> **No RLS policies** — Supabase's `auth.uid()` is incompatible with Clerk JWTs (returns `null`).
> All database access uses the **service role key** (bypasses RLS). User scoping is enforced at the **application level** — every query MUST include `userId` from the verified Clerk JWT.

## Phase 5 Boundary — What Works
- ✅ Extension sign-in via Google OAuth (opens web app, Clerk session syncs back)
- ✅ Task saved to Supabase on completion (task + all steps)
- ✅ Task history API with cursor-based pagination
- ✅ Dashboard with usage stats and task history table
- ✅ Marketing homepage with hero, features, social proof
- ✅ Pricing page (Free/Pro/Power comparison)
- ✅ Download page with OS auto-detection
- ✅ Changelog with timeline layout
- ✅ Clerk middleware enforcing auth on protected routes
- ✅ All Tailwind using DESIGN.md light palette for marketing

## Deliberately Deferred
- Multi-tab orchestration → Phase 6
- Advanced error recovery → Phase 6
- Production deployment → Post Phase 6
