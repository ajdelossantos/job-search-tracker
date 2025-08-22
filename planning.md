Love the goals. You want a **real, useful app** that also showcases **clean, production-adjacent engineering** — without drowning in scope. Here’s a **ruthlessly minimal** yet **well-architected** plan you can ship in a month while building real backend confidence.

---

## 🎯 MVP Goals (Ruthless)

**Must-Have (MVP)**

* Create and manage job applications with:

  * Company name, role title, source (job board/referral), location (optional)
  * Date applied
  * Status (e.g. Applied → Phone Screen → Onsite → Offer → Rejected → Withdrawn)
  * Status history (status + date)
  * Links (job posting, company page, internal doc, etc.)
  * Notes (freeform)
* Export filtered applications to **CSV** (for TWC audit)
* Auth (single-user only to start; simple JWT)
* Basic responsive UI to:

  * Add application
  * List + filter + sort
  * View/edit details
  * Add status update
* Tests for core flows (backend)
* Clean docs (OpenAPI, README, decisions)

**Stretch-Later (Not in MVP)**

* PDF/text/link ingestion (resume/job parsing)
* Email forwarding ingestion
* Workflows/reminders
* Tags & analytics
* Multi-user/team accounts
* PDF report generator
* Browser extension

---

## 🧱 Architecture (Simple, Solid, Scalable)

**Stack**

* **Backend**: FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic + Postgres
* **Frontend**: Next.js (App Router) + TypeScript + React Query + Zod + Tailwind
* **Auth**: JWT (no refresh for MVP; short expiry acceptable)
* **Infra**: Docker Compose (app + db), Fly.io/Render (optional)
* **Docs**: OpenAPI (FastAPI), README + `docs/decisions.md`

**Why this setup works**

* Keeps you aligned with modern backend patterns (DI, schemas, testing)
* Frontend ergonomics + UI speed with React Query
* Minimally deployable and maintainable

---

## 🗃️ Data Model (Lean + Extensible)

**ERD (MVP scope):**

```
users (optional for now; single-user app MVP can hardcode user)
  id (uuid), email, password_hash, created_at

companies
  id (uuid), name (unique per user), website_url, created_at

applications
  id (uuid), user_id (fk), company_id (fk), role_title, source, location,
  date_applied (date), current_status (enum),
  job_posting_url, external_id (optional), notes (text), created_at, updated_at

application_status_history
  id (uuid), application_id (fk), from_status (enum|null), to_status (enum), changed_at (timestamp), notes (optional)

application_links
  id (uuid), application_id (fk), label (e.g. “JD”, “Careers Page”), url

contacts (stretch, can punt from MVP)
  id (uuid), application_id (fk), name, email, phone, role, notes
```

**Enums:**

* `status`: `applied`, `phone_screen`, `technical`, `onsite`, `offer`, `rejected`, `withdrawn`, `ghosted`

  * Add `status_order` mapping for sorting and reports.

**Indexes**

* `applications (user_id, current_status)`
* `applications (created_at)`
* `applications (company_id)`
* `application_status_history (application_id, changed_at)`

---

## 🔌 API Design (Core First)

**Routes (MVP):**

```
AUTH
POST   /auth/login                   # returns JWT (hardcoded single-user ok)

COMPANIES
GET    /companies?query=acme         # for select dropdown
POST   /companies
GET    /companies/{id}

APPLICATIONS
GET    /applications?status=&company=&q=&sort=&page=&limit=
POST   /applications                  # create
GET    /applications/{id}             # includes status history + links
PATCH  /applications/{id}             # update fields
DELETE /applications/{id}
POST   /applications/{id}/status      # add status change (writes history + updates current_status)
POST   /applications/{id}/links
DELETE /applications/{id}/links/{link_id}

EXPORT
GET    /reports/export.csv?status=&start=&end=&company=
```

**Notes:**

* Don’t allow status to be mutated via PATCH; always use `/status` to ensure history is accurate.
* Add basic validation (e.g. URL format, valid status transitions if needed).

---

## 🖥️ Frontend Pages (MVP)

* `/login` – Simple login form
* `/apps` – List + filter/search + “New Application”
* `/apps/new` – Create form (company autocomplete, status defaults to `applied`)
* `/apps/[id]` – Details:

  * Application info (edit in place or via modal)
  * Status history timeline (add new status)
  * Links section (add/remove)
  * Notes editor
* “Export CSV” button on `/apps`

**UI Components:**

* `StatusBadge` (consistent color/status mapping)
* `StatusTimeline`
* `FilterPanel`
* `CompanySelect` (hit `/companies?query=`)
* `LinkList`

---

## 🧪 Testing (Practical MVP)

**Backend (pytest + TestClient):**

* Auth: login returns JWT, protected endpoints reject unauthenticated calls.
* Applications: create/read/update/delete, with valid/invalid payloads.
* Status history: creating `/status` writes both the new `current_status` and a history row.
* Export: returns CSV with consistent column order and filters applied.

**Frontend (stretch for UI tests):**

* Minimal component tests for parsing data (not required for MVP)
* Manual testing + fixtures via Postman/Thunder Client for speed

---

## 📦 Deliverables & Docs

* Clean **README** with:

  * Setup (Docker and local)
  * `.env` examples
  * Running backend and frontend
  * Smoke tests
  * Export and TWC workflow
* **`docs/decisions.md`** with:

  * Auth approach
  * Why status via endpoint (history integrity)
  * Pagination/filtering rationale
  * Indexing + sort logic for status
* **Postman/Insomnia collection** checked in
* **DB migrations** via Alembic

---

## 🚀 Timeline (4 Weeks, 4–5 days/wk)

### Week 1 — Backend Foundation

* [ ] FastAPI app skeleton (routers, deps, error handling)
* [ ] SQLAlchemy models + Alembic
* [ ] JWT auth + DI for DB session
* [ ] Applications CRUD + status history endpoint
* [ ] OpenAPI + Postman collection
* [ ] Unit tests (CRUD + status history)

### Week 2 — Frontend Foundation

* [ ] Next.js app (App Router) + auth (JWT layout protection)
* [ ] API client hooks with React Query
* [ ] Applications list + filters + pagination
* [ ] Create form + company autocomplete
* [ ] Detail page + status timeline + link management

### Week 3 — Polish & Reporting

* [ ] CSV export endpoint + UI
* [ ] Improve validation + error messages (Zod)
* [ ] Documentation upgrades: README, decisions, API docs
* [ ] Backend tests for exports & filters
* [ ] Optional: Docker compose for full stack, seed script

### Week 4 — Hardening & Stretch

* [ ] Bug fixes, cleanup, small UI refinements
* [ ] Potential deploy to Render/Fly.io
* [ ] (Stretch) browser-friendly CSV upload/import
* [ ] (Stretch) tagging or saved filters

---

## ⚠️ Scope Traps to Avoid

* **No PDF parsing in MVP** — it’s a rabbit hole.
* **No email ingestion** — requires infra + security + time.
* **No multitenancy** — single user/local is fine for now.
* **No heavy analytics** — simple status counts can come later.
* **No design system** — use Tailwind, keep components simple.

---

## 🔧 Tooling Suggestions

**Backend**

* `ruff` + `black` (format/lint)
* `pytest` + `pytest-asyncio` (if async)
* `alembic`
* `psycopg[binary,pool]`
* Structured logging via `loguru` (optional)

**Frontend**

* Tailwind
* React Query
* `zod` for form schemas

**Dev UX**

* Pre-commit hooks
* Justfile or Makefile for common commands
* `.vscode` workspace settings for debug/test tasks (optional)

---

## ✅ What You’ll Walk Away With

* A **usable tool** you actually rely on in your job search
* **Confident FastAPI fundamentals** (ORM, DI, auth, migrations, testing)
* A **clean, demonstrable repo** that signals technical maturity
* **Interview-ready stories**: decisions, tradeoffs, pagination, testing, auth, history integrity

---

If you want, I can:

* Generate a starter FastAPI scaffold (models/routers/DI/Alembic wiring)
* Outline the DB schema in code
* Provide React Query hooks and initial Next.js pages

Want me to draft the **database models + FastAPI routes** to save you time on Week 1 setup?
