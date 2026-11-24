# Beyond the Diagnosis

A mobile-first site for the zonal Continuing Rehabilitation Education programme hosted by the Department of Audiology and Speech Language Pathology, Yenepoya (Deemed to be University), Mangaluru.

- **Title:** Beyond the Diagnosis: Disability Assessment, Certification and Entitlements under the RPwD Act, 2016
- **Date:** Saturday, 19 December 2026, from 10:00 IST
- **Mode:** Online (Cisco Webex), English, zonal
- **Acknowledgement:** CRE-26111620026773
- **RCI approval:** F. No. CRE-26111620026773/2026-RCI (24 Nov 2026) · zonal · 4 hours · maximum intake 50 · listed on the [RCI CRE calendar](https://rciregistration.nic.in/rehabcouncil/CreCalendarnew.jsp). Conditions: ISL interpreters must be deputed; the RCI assessment questionnaire must be completed at least one day before (no True/False questions); confirm payments on the RCI portal before the start; assessment report within 48 hours after.
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

## RCI CRE places, master control and the guide

- RCI CRE points: 50 places, first registered, first served (`programme.creSeats`, changeable on the desk under Site switches). A claimant holds a place from registering; a rejected payment frees it. Public pages show places left (`/api/seats`).
- Master control (`/admin/edit/[reference]`, `/admin/new`): every coordinator can edit any field, upload documents, override every decision, give CRE places beyond the limit, accept a repeated payment ID, add registrations directly, and delete (typing the reference). Every change is logged with the coordinator's name.
- Site switches: number of CRE places, registration open/closed.
- Coordinator guide: `public/guides/coordinator-desk-guide.pdf` (screenshots use sample data), linked from the desk.

## Confirmation emails (free, through Gmail)

Set `GMAIL_USER` (the sending Gmail — hemarajanayaka@gmail.com) and `GMAIL_APP_PASSWORD` (a Google App Password: 2-Step Verification on, then myaccount.google.com → Security → App passwords) in Vercel and redeploy. Participants then get: registration received (acknowledgement PDF attached), payment confirmed, and RCI registration confirmed — each once. Replies go to the conference address (yenepoyaaslpconference@gmail.com), and copies stay in the sending account's Sent folder. The desk shows whether email is on, a "Send pending emails" button for people who registered earlier, and "Resend confirmation" per participant. Gmail allows about 500 emails a day. Without the two variables nothing is sent and nothing fails.

## Optional: Razorpay check

If the university's Razorpay account can provide API keys, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` and each `pay_…` id is also confirmed with Razorpay (captured, ₹354). Without them the receipt is read by OCR only.

## E-certificates

- **Participants** — Certificate of Participation for every registration whose payment is confirmed. Coordinators press **Release certificates** on the desk (Exports tab) from 19 December; until then participants see "will appear here after the programme" and a coordinator's preview is a SPECIMEN. Releasing numbers everyone in order of registration (`YMC/ASLP/CRE/2026/0001` …); a number never changes. Participants download from their status page (digital or print edition), share it, add it to LinkedIn, and get it by email (**Email certificates**, a dozen per press). The QR code opens `/verify/<reference>`, which confirms the certificate without showing contact or payment details.
- **Resource persons** — Certificate of Appreciation for each speaker, from `sessions` in `lib/programme.ts` (RP-01 … RP-04). Desk → Exports → Resource persons.
- **Editions** — *digital*: ivory sheet in a navy frame, scanned signatures where present. *print*: white paper area, frame inside the printer's safe margin, CMYK, empty signature lines for ink. Print at actual size on A4 certificate card (200–300 gsm).
- **Signatures** — order and names in `certificateSignatories` (`lib/programme.ts`). Scanned signatures go in `public/brand/signatures/<key>.png` (transparent PNG, about 600 × 200 px): `swathi`, `rachana`, `shwetha`, `dean`.
- **Design** — `lib/certificate-pdf.ts`; fonts in `assets/certificate-fonts/` are static instances of the site's Fraunces and Outfit (SIL Open Font Licence).

## Programme wording to update later

`lib/programme.ts`: `rciApprovalLine` and the `rci…` fields (printed on acknowledgements, certificates and the register), `feeRupees`, `whatsappUrl`, `creSteps` and `dayFormat` (Webex + Slido, RCI online exam, points on the RCI profile).

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
