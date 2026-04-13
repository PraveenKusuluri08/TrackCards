# PayTrack AI

A SaaS that helps you manage multiple credit cards in one place. Never miss a payment, track balances, due dates, and get email reminders.

## Features

- **Dashboard** – View all cards with status labels (Due Soon, Overdue, High Utilization)
- **Card Management** – Add, edit, and delete credit cards
- **Monthly Summary** – Total debt, amount due this month, available credit
- **Payment History** – Record and view payment history per card
- **Email Reminders** – Get notified 3 days before each due date
- **Authentication** – Secure sign up and login with NextAuth

## Tech Stack

- Next.js 16, TypeScript, Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (credentials)
- Resend for emails

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

**Required:**
- `DATABASE_URL` – PostgreSQL connection string (free at [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- `NEXTAUTH_SECRET` – Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` – `http://localhost:3000` for local dev

**For email reminders:**
- `RESEND_API_KEY` – Get at [Resend](https://resend.com)
- `EMAIL_FROM` – Your verified sender (e.g. `PayTrack AI <noreply@yourdomain.com>`)

### 3. Initialize the database

```bash
npx prisma migrate dev --name init
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth, cards, reminders)
│   ├── cards/         # Add, edit, payment history
│   ├── dashboard/
│   ├── login/
│   ├── signup/
│   └── settings/
├── components/
│   ├── ui/
│   ├── dashboard/
│   └── cards/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── email.ts
│   └── utils.ts
└── types/
```

## Email Reminders

The reminder cron runs daily at 9:00 AM UTC. On Vercel, it's configured in `vercel.json`. For local testing, call:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/reminders/cron
```

## Deployment

1. **Vercel** – Connect your repo; add env vars in the dashboard
2. **Database** – Use Neon or Supabase (both work with Vercel)
3. **Cron** – Vercel automatically runs the cron from `vercel.json`

## License

MIT
