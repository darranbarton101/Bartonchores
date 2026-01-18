# Barton Chores

Family chores + pocket money app with adult approvals, kid autonomy, and a ledger-only money model.

## Features
- Adult vs kid roles with Supabase Auth + Row Level Security
- Kid "Today" list, completion requests, and ledger view
- Adult approval inbox, per-kid balances, and one-click payday payouts
- Ledger-only accounting (no mutable balance column)

## Local setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Copy `.env.example` to `.env.local` and add your Supabase project keys:
```bash
cp .env.example .env.local
```

### 3) Supabase setup
Create a new Supabase project and apply migrations + seed data:
```bash
supabase db reset
```
This runs the SQL in `supabase/migrations` and `supabase/seed.sql`.

### 4) Run the app
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Seeded accounts
Password for all accounts: `password123`
- Adult: `alex.adult@barton.dev`
- Kid: `mia.kid@barton.dev`
- Kid: `leo.kid@barton.dev`

## Supabase permissions
Row Level Security policies live in `supabase/migrations/002_rls.sql` and enforce:
- Adults can manage chores, schedules, approvals, and payouts.
- Kids only see their own data and can request completions.
- Ledger entries are insert-only via adult approvals/payouts.

## Vercel deploy
1. Push this repository to GitHub.
2. In Vercel, create a new project and import the repo.
3. Add the environment variables from `.env.local`.
4. Deploy.

## Notes
- Monetary values are stored in `value_pence` as integers.
- Ledger entries track earnings and payouts; balances are computed on the fly.
