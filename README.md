# Beyond the Diagnosis

A mobile-first site for the zonal Continuing Rehabilitation Education programme hosted by the Department of Audiology and Speech Language Pathology, Yenepoya (Deemed to be University), Mangaluru.

- **Title:** Beyond the Diagnosis: Disability Assessment, Certification and Entitlements under the RPwD Act, 2016
- **Date:** Saturday, 19 December 2026, from 10:00 IST
- **Mode:** Online (Cisco Webex), English, zonal
- **Acknowledgement:** CRE-26111620026773
- **Institute code:** KK048
- **Organising chairperson:** Dr. Shwetha Prabhu
- **Organising secretaries:** Ms. Swathi Chinnasamy and Ms. Rachana R Uchil, yenepoyaaslpconference@gmail.com

Registration and queries are collected on this site. Payment stays on the Razorpay link supplied by the department. The coordinator desk exports both lists as CSV and publishes the Webex address.

## Run locally

```bash
npm install
ADMIN_ACCESS_CODE="choose-a-long-code" ADMIN_SESSION_SECRET="choose-a-long-secret" npm run dev
```

Open http://127.0.0.1:3457. Without those two variables the public site still runs, and the coordinator desk stays locked. Local registrations are kept in a temporary database in the running process. They disappear when the process stops.

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Programme pass, invitation, schedule, faculty |
| `/programme` | The four sessions |
| `/faculty` | Resource persons |
| `/department` | Organising department, services, and current staff |
| `/registration` | On-site registration |
| `/attend` | Single link for an RCI listing: register or join |
| `/join` | Opens the Cisco Webex session |
| `/general` | Official Act, guidelines, and programme handouts |
| `/contact` | Queries to the coordinator |
| `/admin` | Desk for the organising secretaries and the conference email |

Give RCI `/attend` if the listing allows one URL. Give `/registration?from=rci` and `/join` if it allows two.

## Coordinator desk

Sign in with `yenepoyaaslpconference@gmail.com` and the access code. Ms. Swathi Chinnasamy, Ms. Rachana R Uchil, and Ms. Pavana M J share that mailbox and that code. The desk can:

- export registrations and queries as CSV
- save a Cisco Webex link (`https://…webex.com/…`), which `/join` then opens

To let another organiser email in, set `ADMIN_EMAILS` to a comma-separated list. Do not commit the access code or the session secret.

## Photographs and the emblem

- Put the university emblem, supplied by Yenepoya, at `public/brand/yenepoya-emblem.svg`.
- Department portraits in `public/department/` are the photographs published on the Yenepoya Medical College department page. Placeholder silhouettes were left out. Resource persons who are not on that page still show initials until a consented headshot is supplied.

The site does not invent degrees, posts, credit hours, or a fee. The fee is whatever Razorpay shows.

## Deploy on Vercel

1. Create a Vercel project from this repository.
2. Set `ADMIN_ACCESS_CODE` and `ADMIN_SESSION_SECRET` for Production.
3. Connect a private Blob store, or a Postgres database as `DATABASE_URL`, so registrations survive. Without one of those, a serverless copy keeps data only in memory.
4. Deploy. The build applies `migrations/` when `DATABASE_URL` is present.

A Postgres database is also declared for Cursor’s app hosting (`cursor-app.json`). That database is separate from a Vercel Blob store. Use one public address so registrations are not split across two hosts.

## Cloudflare later

The same Next.js app can move to Cloudflare Workers with the current Cloudflare Next.js guide. This launch is set up for Vercel, which hosts Next.js without an extra adapter. Do not add Wrangler unless the department asks to move.
