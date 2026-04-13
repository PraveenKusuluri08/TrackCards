# Migration Notes (Core Features Update)

## Existing Users - Email Verification

New signups require email verification. **Existing users** (created before this update) need `email_verified` set so they can log in.

Run one of these:

**Option 1 – SQL (Prisma Studio or `psql`):**
```sql
UPDATE users SET email_verified = created_at WHERE email_verified IS NULL;
```

**Option 2 – Script (if tsx is installed):**
```bash
npx tsx scripts/verify-existing-users.ts
```

## Environment Variables

Add to `.env`:

- `RESEND_API_KEY` – Required for password reset, email verification, and reminders
- `EMAIL_FROM` – Optional, e.g. `PayTrack AI <noreply@yourdomain.com>`
- `NEXTAUTH_URL` – Your app URL (e.g. `https://yourapp.com` for production)
- `CRON_SECRET` – Optional, secures `/api/reminders/cron` when using Vercel Cron

## Cron Setup (Vercel)

In `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/reminders/cron",
    "schedule": "0 14 * * *"
  }]
}
```

Runs daily at 2pm UTC. Add `Authorization: Bearer YOUR_CRON_SECRET` header if using `CRON_SECRET`.
