# Mini Leave Request System

A full-stack leave management app: employees apply for leave, managers approve/reject,
and balances are tracked automatically.

**Stack:** Node.js + Express + MongoDB (backend) · React (Vite) (frontend) · JWT auth

---

## Live Links

- **Frontend (Vercel):** `https://leave-management-system-16.vercel.app`
- **Backend API (Render):** `https://leave-management-system-16.onrender.com`
- **Repo:** `https://github.com/729akashshukla/Leave-Management-System-16`

---

## Features

- Signup/login with role selection (Employee or Manager), JWT-based auth
- Employee: apply for leave (Casual/Sick, date range, reason), view balance, view own request history
- Manager: view pending requests, approve/reject, view full request history
- Leave balance auto-deducted **on approval**, not on application
- Casual: 12 days/year, Sick: 10 days/year (seeded default per new user — see Assumptions)

### Edge cases handled

| Case | Handling |
|---|---|
| **Overlapping requests** | A new request is rejected (`409`) if its date range overlaps any of that employee's existing `Pending` or `Approved` requests. Rejected requests never block. |
| **Insufficient balance** | Checked at application time (immediate feedback) **and** re-checked at approval time, in case the employee's balance changed between applying and being reviewed (e.g. another request was approved in between). |
| **Range spanning a weekend** | See below. |
| **Atomic approval** | Balance deduction + status update are wrapped in a **MongoDB transaction**, so if either write fails the whole operation rolls back — no inconsistent state where balance is deducted but the request stays Pending. Requires a replica set (Atlas free tier works; standalone local `mongod` does not support transactions). |

### Weekend handling — approach

Only **weekdays (Mon–Fri) inside the requested range are deducted** from the leave balance.
Example: a Friday→Monday request spans 4 calendar days but only deducts **2** days, since the
employee wasn't going to work the weekend anyway.

Edge case within this: if a request is *entirely* a weekend (e.g. Sat→Sun), `workingDays` is `0`
and it's still allowed through with zero deduction, rather than being rejected outright. This was
a judgment call — the assessment left it open, and "allow but deduct nothing" seemed less
surprising than blocking a valid calendar selection. Logic lives in `backend/utils/dateUtils.js`.

---

## Assumptions

- Role (Employee/Manager) is chosen at signup — there's no separate admin flow to promote
  users, since the assessment didn't specify an org hierarchy. In a real system this would be
  admin-assigned, not self-selected.
- Every new user gets a default balance (12 Casual / 10 Sick) rather than an HR-configured one.
- A manager can approve/reject **any** employee's request — there's no manager-to-team mapping,
  since the assessment describes a single manager role rather than a team hierarchy.
- Leave balance is deducted only on approval (explicit in the brief), not reserved/held at
  application time.

---

## Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)

### Backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI (Atlas connection string) and JWT_SECRET (any long random string)
npm install
npm run dev        # nodemon, or `npm start` for plain node
npm test           # runs the test suite (no extra dependencies needed)
```
Runs on `http://localhost:5000`.

#### Tests
```bash
npm test
```
18 unit tests covering the assessment's edge cases — date parsing, weekend
calculation, overlap detection, balance checks, approval deduction, and
rejection safety. Uses Node's built-in `assert` module (zero test-framework
dependencies).



### Frontend
```bash
cd frontend
cp .env.example .env
# edit .env: VITE_API_URL=http://localhost:5000/api (for local dev)
npm install
npm run dev
```
Runs on `http://localhost:5173`.

---

## Deployment

### 1. Database — MongoDB Atlas
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Database Access → add a user with a password.
3. Network Access → allow access from anywhere (`0.0.0.0/0`) for simplicity.
4. Copy the connection string → this is your `MONGO_URI`.

### 2. Backend — Render
1. Push this repo to GitHub.
2. On [render.com](https://render.com) → New → Web Service → connect the repo, set **root directory to `backend`**.
3. Build command: `npm install`, Start command: `npm start`.
4. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT=5000`.
5. Deploy. Note the resulting URL, e.g. `https://leave-app-backend.onrender.com`.

*(A `render.yaml` is included in `backend/` if you prefer Render's Blueprint deploy.)*

### 3. Frontend — Vercel
1. On [vercel.com](https://vercel.com) → New Project → import the repo, set **root directory to `frontend`**.
2. Framework preset: Vite.
3. Add environment variable: `VITE_API_URL=https://<your-render-backend-url>/api`.
4. Deploy.

Once both are live, update the **Live Links** section above and update CORS if you lock it
down further (currently `cors()` allows all origins for simplicity — fine for a free-tier demo).

---

## AI Tool Usage Disclosure

**Tool used:** Claude (Claude Code / claude.ai)

**What it was used for:**
- Scaffolding the full Express backend (models, controllers, routes, middleware) and the
  React frontend (pages, routing, auth context) from the assessment spec.
- Working through the three required edge cases (overlap detection, balance validation,
  weekend handling) and picking a defensible approach for each.
- Converting the codebase from CommonJS (`require`/`module.exports`) to ES6 modules
  (`import`/`export`).
- Writing this README and the deployment configs.

**Things AI got wrong / that I changed:**

1. **Balance deducted at submission instead of approval.**
   An early draft deducted the employee's leave balance **at the moment the request was
   submitted** rather than at approval. That's the more common pattern in simple CRUD
   tutorials, but it directly contradicts this assessment's requirement that the balance
   "should be deducted correctly **once a leave request is approved**." I caught this against
   the spec and corrected it: balance is now only touched in `approveRequest`, and it's
   re-validated at that point too (not just at submission), so a manager can't approve a
   request that would push the balance negative if the employee's balance shifted in the
   meantime.

2. **`new Date("YYYY-MM-DD")` UTC parsing bug — wrong weekday calculation.**
   The AI-generated code parsed user-supplied date strings with `new Date(startDate)`.
   Per the ES spec, `new Date("2026-09-28")` is interpreted as **UTC midnight**, not local
   midnight. On a server running in a timezone ahead of UTC (like IST, UTC+5:30) this
   produces `05:30 AM` local time instead of `00:00` — and on servers *behind* UTC (common
   on US-based cloud hosts) it silently shifts to the **previous calendar day**. This means
   a user selecting Monday→Monday could have the backend see Sunday→Sunday, and
   `countWorkingDays` would return **0** instead of **1**, causing the wrong leave balance
   deduction. I spotted this during review and fixed it by adding a `parseDateOnly()` helper
   in `backend/utils/dateUtils.js` that splits `"YYYY-MM-DD"` and constructs the Date with
   `new Date(year, month - 1, day)`, which always gives local midnight on the intended
   calendar date regardless of the server's timezone.

