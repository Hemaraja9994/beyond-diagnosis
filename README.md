# Beyond the Diagnosis

A mobile-first site for the zonal Continuing Rehabilitation Education programme hosted by the Department of Audiology and Speech Language Pathology, Yenepoya (Deemed to be University), Mangaluru.

- **Title:** Beyond the Diagnosis: Disability Assessment, Certification and Entitlements under the RPwD Act, 2016
- **Date:** Saturday, 19 December 2026, from 10:00 IST
- **Mode:** Online (Cisco Webex), English, zonal
- **Acknowledgement:** CRE-26111620026773
- **Institute code:** KK048
- **Organising chairperson:** Dr. Shwetha Prabhu
- **Organising secretaries:** Ms. Swathi Chinnasamy and Ms. Rachana R Uchil, yenepoyaaslpconference@gmail.com

Participants pay ₹354 on the department's Razorpay page first, then register here with the payment ID and the receipt. Receipts, CRR certificates and RCI confirmation mails are read automatically on the site's own server (free Tesseract OCR; nothing goes to an outside AI service). Coordinators confirm payments, RCI registrations, Webex attendance, the RCI online examination and CRE points on the desk, and participants see their status and download an A4 acknowledgement PDF.

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
| `/registration` | Pay first, then register with payment ID + receipt (+ optional CRR certificate, RCI mail) |
| `/registration/rci` | Upload the RCI confirmation mail later (claiming CRE points) |
| `/registration/status` | Look up status with reference + email; download / WhatsApp the acknowledgement PDF |
| `/registration/update` | Older registrations add title, CRR, receipt or files |
| `/status/[reference]?t=…` | Participant's private status page and CRE journey (QR on the PDF opens it) |
| `/attend` | Single link for an RCI listing: register or join |
| `/join` | Opens the Cisco Webex session |
| `/general` | Official Act, guidelines, and programme handouts |
| `/contact` | Queries to the coordinator |
| `/admin` | Desk for the organising secretaries and the conference email |

Give RCI `/attend` if the listing allows one URL. Give `/registration?from=rci` and `/join` if it allows two.

## Coordinator desk

`/admin`. Each coordinator signs in with her own username — `rachana`, `swathi`, `pavana` — and password. Starting passwords are kept in `lib/desk-defaults.ts` only as slow scrypt hashes; a password saved on the desk (stored as a hash in the site's database) replaces the starting one. The owner can still sign in with `yenepoyaaslpconference@gmail.com` and `ADMIN_ACCESS_CODE` to reset any coordinator's password.

The desk can:

- search and filter registrations (needs attention, payment confirmed, claiming CRE, RCI awaited)
- see the automatic check (Verified / Needs review / Mismatch) with details, open the receipt, CRR certificate and RCI mail, and check again
- mark payment verified or rejected, RCI registration confirmed or rejected, Webex attendance, RCI online exam passed / not passed, CRE points credited — every decision is stamped with the coordinator's name, and a coordinator's decision always wins over the automatic check
- bulk-update by pasting emails, CRR numbers or references (e.g. the Webex attendance report)
- WhatsApp or email one participant, open their status page / PDF
- download the participant register (A4 landscape PDF or Word, with logo and signature lines), CSV of everything, the RCI list of CRE claimants, and queries
- publish the Webex link

## Confirmation emails (free, through Gmail)

Set `GMAIL_USER` (the sending Gmail — hemarajanayaka@gmail.com) and `GMAIL_APP_PASSWORD` (a Google App Password: 2-Step Verification on, then myaccount.google.com → Security → App passwords) in Vercel and redeploy. Participants then get: registration received (acknowledgement PDF attached), payment confirmed, and RCI registration confirmed — each once. Replies go to the conference address (yenepoyaaslpconference@gmail.com), and copies stay in the sending account's Sent folder. The desk shows whether email is on, a "Send pending emails" button for people who registered earlier, and "Resend confirmation" per participant. Gmail allows about 500 emails a day. Without the two variables nothing is sent and nothing fails.

## Optional: Razorpay check

If the university's Razorpay account can provide API keys, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` and each `pay_…` id is also confirmed with Razorpay (captured, ₹354). Without them the receipt is read by OCR only.

## Programme wording to update later

`lib/programme.ts`: `rciApprovalLine` (printed on acknowledgements), `feeRupees`, `whatsappUrl`, `creSteps` and `dayFormat` (Webex + Slido, RCI online exam, points on the RCI profile).

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
