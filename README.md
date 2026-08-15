# The Woodlands Islamic Center (WIC) App

A single Expo (React Native + Web) app that serves as the daily connection
between The Woodlands Islamic Center and its community — prayer times,
announcements, events, Quran, Qibla, donations, programs, volunteering, and a
built-in admin dashboard for WIC staff.

---

## 1. Technology Stack (and why)

| Layer | Choice | Free? | Notes |
|---|---|---|---|
| Mobile + Web app | **Expo (React Native + Expo Router) + TypeScript** | Free, open-source | One codebase → iOS, Android, and Web. Expo Router gives us file-based routing and a web build for the admin dashboard, so we don't need a separate Next.js project. |
| Backend / Database | **Supabase (free tier)** | Free tier: 500MB DB, 1GB file storage, 5GB bandwidth/mo, 50k monthly active auth users | Postgres database, Row Level Security, Auth (magic links), and Storage all in one. Self-hostable later (Supabase is open source) if WIC ever outgrows the free tier. |
| Authentication (admins only) | **Supabase Auth — email magic links** | Free | No passwords to leak. Public app users never need an account. |
| Prayer calculation | **Adhan.js** (`adhan` npm package) | Free, open-source, local — no API/network calls | Calculates Fajr/Sunrise/Dhuhr/Asr/Maghrib/Isha and Qibla direction from GPS coordinates using astronomical formulas. Official WIC iqamah times (entered by admins in Supabase) always override/display alongside these. |
| Quran | **AlQuran Cloud API** (`api.alquran.cloud`) | Free, open, no key required | Islamic Network project. Arabic (Uthmani script), English translation (Saheeh International), and audio recitation (Sheikh Mishary Alafasy) — see licensing section below. |
| Qibla / Compass | **Adhan.js `Qibla()` + `expo-location` heading** | Free, local calculation | No paid mapping API needed. |
| Push notifications | **Expo Notifications** | Free (Expo's push service) | Users opt in per-category; tokens + preferences stored in `device_push_tokens` table (no personal identity attached). |
| Maps / Directions | **Native OS maps via URL schemes** (Apple Maps / Google Maps) | Free | Opens the user's own preferred maps app — no embedded map SDK or API key needed. |
| Newsletter | **Supabase table + your existing email provider** | Free (Supabase insert) | `newsletter_subscribers` table collects opt-ins; sending is done by WIC via whatever free-tier ESP you choose (e.g., free tier of Brevo/Mailchimp) — see Phase 2 notes below. |
| Donations | **Link-out to WIC's existing/approved payment provider** | N/A | We never process or store card data. `donation_campaigns.donation_url` points to your existing donation page(s). |

### Why not X?
- **Firebase** was considered for push/analytics but Supabase already covers
  database + auth + storage in one free tier, avoiding a second vendor and
  extra API keys to manage. Expo Notifications works without a separate
  Firebase project for the MVP.
- **MapLibre / OpenStreetMap tile rendering** wasn't needed because we only
  need "Get Directions," which native map apps handle for free without an
  embedded map SDK.
- **Next.js admin dashboard** was skipped in favor of building admin screens
  inside the same Expo Router app (`app/admin/*`), which also runs as a
  website via `npx expo export --platform web` — one codebase, one deploy.

---

## 2. Project Structure

```
wic-masjid-app/
├── app/                      # Expo Router screens (file-based routing)
│   ├── _layout.tsx           # Root stack layout
│   ├── (tabs)/                # Bottom tab navigator: Home | Prayer | Events | Quran | More
│   ├── prayer/jumuah.tsx      # Jumu'ah detail screen
│   ├── events/[id].tsx        # Event detail (register, add to calendar, share, directions)
│   ├── quran/[surah].tsx      # Surah reader (Arabic + translation + audio + bookmarks)
│   ├── more/                  # Qibla, Islamic Calendar, Programs, Ramadan, Donations,
│   │                          # Building Fund, Volunteer, Announcements, Contact, Settings
│   └── admin/                 # Admin dashboard (magic-link sign in + role-gated screens)
├── components/                 # Reusable UI: Card, Button, Badge, PrayerScheduleTable, etc.
├── constants/                  # theme.ts (colors/spacing/type), masjid.ts (WIC info)
├── lib/                        # Data layer: supabase.ts, prayerTimes.ts, hijriDate.ts,
│                                # quranApi.ts, notifications.ts, adminAuth.ts, offlineCache.ts, etc.
└── supabase/schema.sql         # Full Postgres schema + Row Level Security policies
```

---

## 3. Setup Instructions

### 3.1 Create a free Supabase project
1. Go to https://supabase.com → New Project (free tier).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon/public key**.

### 3.2 Configure environment variables
```bash
cp .env.example .env
```
Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
EXPO_PUBLIC_DONATION_URL=https://your-existing-donation-page.example.com
EXPO_PUBLIC_BUILDING_FUND_DONATION_URL=https://your-existing-donation-page.example.com/building-fund
```
> The anon key is safe to ship in the app — every table is protected by Row
> Level Security so it can only read published/active rows and cannot write
> anything without being an authenticated admin.

### 3.3 Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3.4 Run the app
```bash
npx expo start          # then press i (iOS), a (Android), or w (web)
```

### 3.5 Create your first Super Admin
1. In the app (or web build), go to **More → Settings → "WIC Staff: Admin Dashboard"**.
2. Enter your email and tap **Send Sign-In Link**. Check your inbox and open the magic link on the same device.
3. In the Supabase SQL editor, run:
```sql
insert into admin_users (id, role, display_name)
values ('<the-auth-user-uuid-from-Authentication-tab>', 'super_admin', 'Your Name');
```
4. Reload the admin screen — you'll now see the full dashboard.

---

## 4. Admin Roles

| Role | Can manage |
|---|---|
| `super_admin` | Everything, including other admin accounts |
| `masjid_admin` | Prayer/iqamah times, Jumu'ah, donations, building fund, Ramadan schedule, calendar |
| `content_editor` | Announcements, programs |
| `events_manager` | Events, volunteer opportunities |

All changes are recorded in the `audit_log` table (visible under **Admin → Audit Log**).

---

## 5. Quran Source & Licensing

- **Arabic text:** Uthmani script (`quran-uthmani` edition) — the standard
  text used in the vast majority of printed Mus'hafs worldwide.
- **English translation:** Saheeh International (`en.sahih`).
- **Audio recitation:** Sheikh Mishary Rashid Alafasy (`ar.alafasy`), served
  from the Islamic Network's free CDN.
- **Provider:** [AlQuran Cloud](https://alquran.cloud/api) — a free, open
  REST API maintained by the Islamic Network project. No API key required.
- The app displays this text exactly as returned by the API and never
  modifies it. See `lib/quranApi.ts` for the full source declaration
  (`QURAN_SOURCE_INFO`).

---

## 6. Privacy & Security

- Core prayer/masjid info works **without an account**.
- Location is only requested for the **Qibla finder**, with an explanation
  shown before the permission prompt, and is never stored or transmitted.
- Quran bookmarks/last-read position are stored **only on-device**.
- Notification preferences are stored per-device (push token + category
  flags) — no religious-practice profile is built.
- Admin actions require Supabase Auth + role check enforced by **Row Level
  Security** (not just client-side checks) — see `supabase/schema.sql`.
- No secret API keys are embedded in the app; the only key shipped is the
  Supabase anon key, which is safe by design (RLS-gated).

---

## 7. Offline Support

Today's prayer times, Jumu'ah times, announcements, events, programs,
donation campaigns, volunteer opportunities, Ramadan schedule, and the last
successfully-loaded Islamic calendar events are all cached on-device
(`lib/offlineCache.ts`, backed by AsyncStorage) and shown when the network is
unavailable.

---

## 8. MVP Checklist

- [x] Project scaffolded (Expo + TypeScript + Expo Router)
- [x] Design system (navy/ivory/gold theme, accessible typography)
- [x] Supabase schema + RLS policies (14 tables, audit log, roles)
- [x] Local prayer time calculation (Adhan.js) + official iqamah overrides
- [x] Home screen (next prayer countdown, schedule, announcements)
- [x] Prayer tab + Jumu'ah detail screen
- [x] Events list + detail (register, add to calendar, share, directions)
- [x] Quran (surah list/search, reader, audio, bookmarks, last-read)
- [x] Qibla finder (local calculation + compass)
- [x] Islamic calendar (calculated Hijri + admin-confirmed dates)
- [x] Programs (Quran & Education, Youth, Sisters, Children)
- [x] Ramadan mode (auto-highlighted schedule)
- [x] Donations + Building Fund progress
- [x] Volunteer opportunities + signup
- [x] Contact/About + Get Directions
- [x] Settings (per-category notification preferences + newsletter signup)
- [x] Admin dashboard (magic-link auth, role-gated CRUD, audit log)
- [x] Offline caching for core data
- [x] TypeScript compiles cleanly; Web + iOS bundles export successfully; `expo-doctor` 21/21 passed

## 9. Phase 2 / Phase 3 (not built yet, architecture allows for later)
- Livestreams / khutbah recordings
- Membership & family accounts
- Weekend-school registration & tuition
- Local halal/business directory
- Janazah push-notification shortcut
- Automated newsletter sending (currently: signups are collected; sending
  requires connecting a free-tier ESP like Brevo — deliberately left out of
  MVP to avoid unnecessary complexity)
- Multiple masjid locations
