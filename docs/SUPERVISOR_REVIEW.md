# Showcase — Independent Technical Review for Project Supervisor

**Product:** Showcase (musician booking platform)  
**Review date:** 14 September 2026  
**Reviewer:** technical code review of the current repository  
**Scope:** architecture, implemented features, security, tests, documentation, and production readiness  
**Primary source tree reviewed:** `C:\Users\Yeshua\Desktop\showcasee\showcase`  
**Workspace copy also present:** `D:\showcasee\showcase` (documentation and build artifacts; application source under `src/` is not present in this copy)

---

## 1. Executive verdict

**Showcase is a substantial academic/MVP prototype, not a production-ready product.**

The team chose a coherent stack (Next.js 14 App Router, TypeScript, PostgreSQL/Prisma, Auth.js, Stripe, UploadThing, Vercel/Neon) and implemented most of the planned surface: public search, musician profiles, events, bookings, reviews, in-app notifications, chat on bookings, admin APIs, and a Stripe payment-intent path.

It should **not** be presented as “ready to go live.” Several core flows are incomplete or incorrect, documented claims do not match the code, automated tests do not cover the business, and payouts would fail against a real Stripe Connect account.

**Recommended supervisor decision**

| Question | Answer |
|---|---|
| Is there a real product skeleton? | Yes |
| Can it be used as an academic demonstration with caveats? | Yes, after the blockers below are listed as known limitations |
| Can it be approved as a completed production MVP? | No |
| Should production deploy proceed now? | No |

---

## 2. What the system is

Showcase aims to connect **clients** who need musicians for events with **musicians** who offer skills, a service radius, and availability. An **admin** role moderates users, verifications, and reports. The intended hiring flow is:

client search → musician profile → event/booking request → musician accept → client confirm → Stripe hold → event complete → review → payout.

Architecture decisions (modular monolith, EVENT vs BOOKING, approximate musician location, deterministic matching) are documented and mostly reflected in the data model.

---

## 3. What is actually implemented

### Strengths

- Clear domain model: `User`, `Client`, `Musician`, `Skill` (with synonyms), `Event`, `Booking`, `Availability`, `Review`, `Payment`, `Payout`, `Notification`, `Message`, `Report`, `Verification`, `AdminAction`, `AuditLog`.
- Role-aware APIs for bookings, reviews, payments initiation, admin user updates, and booking chat.
- Booking **state machine** with role checks and calendar overlap checks on accept/create.
- Search with accent-normalized tokens, synonym matching, Haversine distance, and a isolated ranking module (`src/lib/matching.ts`).
- Public musician GET strips `latitude`/`longitude` (privacy intent is real).
- Password-reset token is stored hashed-length random bytes with expiry; responses avoid email enumeration.
- Admin metrics and user moderation APIs require `ADMIN`.
- UploadThing image upload is session-gated to musician/admin.

### Phase status (code vs `PROJECT_STATUS.md`)

`PROJECT_STATUS.md` is dated **27 August 2026** and understates the code that exists (payments, reviews, admin, notifications are marked PLANNED while routes and pages exist). It also overstates completeness of auth and deploy.

| Phase | Documented status | Code reality | Readiness (0–100) |
|---|---|---|---|
| 0 Audit / 1 Foundation | Completed | Stack and scripts exist; root README missing; no project CI | 70 |
| 2 Architecture | Approved | Sound ADRs; several ADRs not implemented as written | 75 |
| 3 UX/UI | Approved (doc) | Screens exist; UX doc still says IN_PROGRESS | 65 |
| 4 Authentication | Completed | Login works; **registration API is broken**; rate limit unused | 40 |
| 5 Musician profile | Under review | CRUD + IDOR check; media URL is fake; PUT leaks coordinates | 65 |
| 6 Search + geo | In progress | Works in-memory; not pg_trgm; radius is a score, not a hard filter | 60 |
| 7 Events + booking | In progress | Strongest business module | 75 |
| 8 Payments | Planned (docs) | Intent + webhook exist; Connect payout is incorrect | 35 |
| 9 Reviews | Planned (docs) | Create API with uniqueness and COMPLETED gate | 70 |
| 10 Notifications | Planned (docs) | In-app list/mark-read; booking emails not wired | 55 |
| 11 Admin | Planned (docs) | APIs exist; UI middleware does not enforce ADMIN | 65 |
| 12 Tests + security | Planned | 3 Jest files, 8 trivial tests; no E2E; no GitHub Actions | 20 |
| 13 Deploy | In progress | `vercel.json` + DEPLOY.md; PostGIS still in Prisma on Desktop | 45 |
| 14 Final audit | Planned | Not started | 0 |

---

## 4. Blockers (must fix before any production claim)

### B1 — User registration does not work

The register page `POST`s to `/api/auth/register`. The route only exports `GET` and that GET requires an **ADMIN** session. There is no `POST` handler that creates a user, hashes a password, or creates `Client`/`Musician` profiles.

**Impact:** a new user cannot sign up through the product UI. This contradicts the “Phase 4 completed” status.

### B2 — Stripe payout destination is not a Stripe account

`POST /api/payments/release` transfers to `destination: payment.booking.musicianId` (internal CUID). Stripe Connect requires an `acct_...` destination. The code itself contains a TODO to fix this.

**Impact:** escrow release cannot succeed in a real Stripe environment.

### B3 — Failed payments are marked refunded

The webhook maps `payment_intent.payment_failed` to status `REFUNDED`. A failed authorization is not a refund. `charge.refunded` is not handled.

### B4 — Schema vs deploy story conflict

Desktop `prisma/schema.prisma` still enables **PostGIS**. Project docs and DEPLOY.md say production is Neon **without** PostGIS. A `prisma migrate deploy` against Neon using the Desktop schema will fail or require an extension Neon may not provide.

### B5 — Unauthenticated skill seed endpoint

`POST /api/skills/seed` has no authentication. Anyone can hit it in production.

### B6 — Two diverging project copies

The Cursor workspace at `D:\showcasee\showcase` has docs, `package.json`, and a `.next` build, but not the `src/` tree. The compiled build still points at `C:\Users\Yeshua\Desktop\showcasee\showcase\src`. Supervisors reviewing only `D:\` will not see the application source. This is a delivery/integrity risk.

---

## 5. High-severity findings (not necessarily launch-blocking, but serious)

1. **Rate limiting is dead code.** `src/lib/rate-limit.ts` exists and is never called. Auth, forgot-password, and seed are unprotected against abuse.
2. **Email verification is not enforced.** Users have `PENDING_VERIFICATION` / `emailVerified`, but login does not require verification. `verificationEmail()` is unused from a working register flow.
3. **JWT roles are stale.** Session role/status come from login-time JWT. Blocking a user does not invalidate an existing session. Middleware only checks “logged in”, not ADMIN, for `/admin`.
4. **Musician PUT returns full record including coordinates**, undoing the privacy strip on GET.
5. **Local media POST stores a fake `/uploads/...` URL** and never writes a file. UploadThing covers images only (4MB), not video/audio advertised in ADRs.
6. **Search does not implement pg_trgm** (ADR-005). Matching is in-process `includes()` after loading all matching musicians. Radius does not exclude out-of-range musicians. Availability uses a hardcoded 3-hour window, not the event duration.
7. **Observability ADR is unmet:** no health route, no structured logging library, no Sentry wiring despite `SENTRY_DSN` in `.env.example`.
8. **TESTING.md claims GitHub Actions and Playwright are configured.** There is no project `.github/workflows` file. Tests do not import application modules; they only assert bcrypt and Zod enums.
9. **Documentation drift:** no root `README.md`; `docs/API.md` lists `/api/auth/login` which does not exist (NextAuth credentials); DATABASE.md event states do not match schema (`OPEN`/`BOOKED` vs a long EVENT enum).
10. **Multiple PrismaClient instances** (`auth.ts`, `forgot-password/route.ts` vs `@/lib/prisma`) risk exhausting connections on serverless.

---

## 6. Testing and quality gates

Reported in the August review: typecheck, 8 Jest tests, and production build passed. That is necessary but not sufficient.

Current automated tests:

- `src/lib/__tests__/auth.test.ts` — bcrypt hash/compare only
- `src/app/api/__tests__/bookings.test.ts` — Zod enum parse only
- `src/app/api/__tests__/reviews.test.ts` — Zod object parse only

There are **no** tests for IDOR, booking transitions, conflicts, Stripe webhook, search ranking, or registration. Definition of Done (code + tests + docs + reviewer) is not met for phases marked completed.

---

## 7. Suggested message to the supervisor

> Showcase has a credible architecture and a large portion of the MVP coded (search, profiles, booking state machine, reviews, admin APIs, Stripe intent). It is suitable as a **supervised academic prototype** if limitations are explicit. It is **not** suitable to declare as a finished production platform: registration is broken, payouts cannot hit Stripe Connect, tests do not cover business rules, docs disagree with the schema, and two copies of the repo have diverged. Recommended next step is a short remediation sprint on blockers B1–B6, then a live demo on a staging environment—not a production launch.

---

## 8. Remediation order (if the team continues)

1. Restore `POST /api/auth/register` (hash password, create Client or Musician, optional verification email) and add rate limits.
2. Align Prisma with Neon (remove PostGIS) **or** change the deploy target; keep a single source tree.
3. Protect `/api/skills/seed`; protect `/admin` by role in middleware.
4. Store Stripe Connect account IDs; fix webhook statuses and event idempotency.
5. Stop returning musician coordinates on PUT; persist real media or document image-only UploadThing.
6. Add integration tests for register, booking transitions, IDOR, and webhook signature failure.
7. Rewrite `PROJECT_STATUS.md` and add a root README that matches the running system.

---

## 9. Review limitations

- This review inspected source, Prisma schema, tests, and project docs. It did not run a live end-to-end demo against Stripe/Neon in this session.
- Secrets were not requested or opened.
- Findings are based on the Desktop source tree dated with the current workspace; if another branch is the official delivery, it should be frozen and re-reviewed.
